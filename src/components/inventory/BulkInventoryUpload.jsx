import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function BulkInventoryUpload({ shop, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const downloadTemplate = () => {
    const csvContent = `product_name,description,price,part_number,category,sub_category,brand,sku,condition,stock_quantity,low_stock_threshold,image_url,compatible_vehicle_brands,compatible_vehicle_models,compatible_vehicle_years
Toyota Brake Pads,Front brake pads for Toyota vehicles,250.00,BP-TOY-001,brakes,brake_pads,Toyota,SKU001,new,50,10,https://example.com/image.jpg,"Toyota","Corolla;Camry","2015;2016;2017;2018;2019;2020"
Engine Oil Filter,High quality oil filter,45.50,EOF-GEN-002,filters,oil_filters,Bosch,SKU002,new,120,15,,"Toyota;Nissan","Corolla;Altima","2014;2015;2016;2017;2018;2019;2020"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data using the Core integration
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  part_number: { type: "string" },
                  category: { type: "string" },
                  sub_category: { type: "string" },
                  brand: { type: "string" },
                  sku: { type: "string" },
                  condition: { type: "string" },
                  stock_quantity: { type: "number" },
                  low_stock_threshold: { type: "number" },
                  image_url: { type: "string" },
                  compatible_vehicle_brands: { type: "string" },
                  compatible_vehicle_models: { type: "string" },
                  compatible_vehicle_years: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === "error") {
        toast.error(extractResult.details || "Failed to parse file");
        setUploading(false);
        return;
      }

      const products = extractResult.output?.products || extractResult.output || [];
      
      if (!Array.isArray(products) || products.length === 0) {
        toast.error("No valid products found in file");
        setUploading(false);
        return;
      }

      // Fetch all vehicles for matching
      const allVehicles = await base44.entities.Vehicle.list();

      // Process and create products
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const item of products) {
        try {
          // Parse compatible vehicles
          const compatible_vehicles = [];
          if (item.compatible_vehicle_brands || item.compatible_vehicle_models || item.compatible_vehicle_years) {
            const brands = item.compatible_vehicle_brands?.split(';').map(s => s.trim()).filter(Boolean) || [];
            const models = item.compatible_vehicle_models?.split(';').map(s => s.trim()).filter(Boolean) || [];
            const years = item.compatible_vehicle_years?.split(';').map(s => s.trim()).filter(Boolean) || [];

            // Match with existing vehicles
            for (const brand of brands) {
              for (const model of models) {
                const matchingVehicle = allVehicles.find(v => 
                  v.brand?.toLowerCase() === brand.toLowerCase() && 
                  v.model?.toLowerCase() === model.toLowerCase()
                );
                if (matchingVehicle) {
                  compatible_vehicles.push({
                    vehicle_id: matchingVehicle.id,
                    brand: matchingVehicle.brand,
                    model: matchingVehicle.model,
                    years: years.map(y => parseInt(y)).filter(y => !isNaN(y))
                  });
                }
              }
            }
          }

          const productData = {
            name: item.product_name || item.name,
            description: item.description || "",
            price: parseFloat(item.price) || 0,
            part_number: item.part_number || "",
            category: item.category || "other",
            sub_category: item.sub_category || "",
            brand: item.brand || "",
            sku: item.sku || "",
            condition: item.condition || "new",
            stock_quantity: parseInt(item.stock_quantity) || 0,
            low_stock_threshold: parseInt(item.low_stock_threshold) || 5,
            shop_id: shop.id,
            shop_name: shop.name,
            image_url: item.image_url || "",
            image_urls: item.image_url ? [item.image_url] : [],
            compatible_vehicles,
            status: "active"
          };

          await base44.entities.Product.create(productData);
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`${item.product_name || item.name || 'Unknown'}: ${err.message}`);
        }
      }

      setResults({
        total: products.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} products`);
        if (onSuccess) onSuccess();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} products failed to import`);
      }
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResults(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <Upload className="w-4 h-4" />
        Bulk Upload
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Bulk Inventory Upload
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Instructions */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Download the CSV template below</li>
                  <li>Fill in your product data (Excel or CSV)</li>
                  <li>For compatible vehicles, use semicolons to separate multiple values (e.g., "Toyota;Nissan")</li>
                  <li>Upload the completed file</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Template Download */}
            <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
              <Download className="w-4 h-4" />
              Download CSV Template
            </Button>

            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="inventory-upload"
              />
              <label htmlFor="inventory-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-medium">
                    {file ? file.name : "Click to select CSV or Excel file"}
                  </p>
                  <p className="text-xs text-slate-500">Supports .csv, .xlsx files</p>
                </div>
              </label>
            </div>

            {/* Results */}
            {results && (
              <Alert className={results.errors > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}>
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Upload Results:</p>
                  <div className="text-sm space-y-1">
                    <p>Total: {results.total} products</p>
                    <p className="text-emerald-600">✓ Success: {results.success}</p>
                    {results.errors > 0 && (
                      <>
                        <p className="text-red-600">✗ Errors: {results.errors}</p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium">View error details</summary>
                          <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-auto">
                            {results.errorDetails.map((err, idx) => (
                              <li key={idx} className="text-red-600">• {err}</li>
                            ))}
                          </ul>
                        </details>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Field Reference */}
            <details className="text-xs bg-slate-50 p-3 rounded-lg">
              <summary className="cursor-pointer font-semibold text-slate-700">Column Reference</summary>
              <div className="mt-2 space-y-1 text-slate-600">
                <p><strong>Required:</strong> product_name, price, category</p>
                <p><strong>Category values:</strong> engine, brakes, suspension, electrical, body, transmission, exhaust, cooling, steering, interior, accessories, tyres, filters, oils_fluids, other</p>
                <p><strong>Condition values:</strong> new, used, refurbished</p>
                <p><strong>Vehicle compatibility:</strong> Use semicolons to separate (e.g., "Toyota;Nissan")</p>
              </div>
            </details>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}