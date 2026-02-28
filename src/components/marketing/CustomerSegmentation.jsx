import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, TrendingUp, Calendar, MapPin } from "lucide-react";

export default function CustomerSegmentation({ shopId, customers = [] }) {
  const [segments, setSegments] = useState([
    {
      id: "high_value",
      name: "High Value Customers",
      description: "Customers who spent K500,000+",
      criteria: { type: "spending", minAmount: 500000 },
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-700"
    },
    {
      id: "recent",
      name: "Recent Customers",
      description: "Customers from last 30 days",
      criteria: { type: "recency", days: 30 },
      icon: Calendar,
      color: "bg-blue-50 text-blue-700"
    },
    {
      id: "location",
      name: "By Location",
      description: "Filter customers by region or town",
      criteria: { type: "location" },
      icon: MapPin,
      color: "bg-purple-50 text-purple-700"
    }
  ]);

  const [dialog, setDialog] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [customSegmentName, setCustomSegmentName] = useState("");
  const [customCriteria, setCustomCriteria] = useState({ type: "spending", minAmount: 0 });

  // Calculate segment members
  const getSegmentMembers = (segment) => {
    let filtered = [...customers];

    if (segment.criteria.type === "spending") {
      filtered = filtered.filter(c => (c.total_spent || 0) >= segment.criteria.minAmount);
    } else if (segment.criteria.type === "recency") {
      const cutoffDate = new Date(Date.now() - segment.criteria.days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => new Date(c.created_date) > cutoffDate);
    } else if (segment.criteria.type === "location") {
      if (segment.criteria.region) {
        filtered = filtered.filter(c => c.region === segment.criteria.region);
      }
      if (segment.criteria.town) {
        filtered = filtered.filter(c => c.town === segment.criteria.town);
      }
    }

    return filtered;
  };

  const segmentStats = useMemo(() => {
    return segments.map(seg => ({
      ...seg,
      count: getSegmentMembers(seg).length
    }));
  }, [segments, customers]);

  const handleAddCustomSegment = () => {
    if (!customSegmentName.trim()) {
      toast.error("Please enter a segment name");
      return;
    }

    const newSegment = {
      id: `custom_${Date.now()}`,
      name: customSegmentName,
      description: "Custom segment",
      criteria: customCriteria,
      icon: Users,
      color: "bg-indigo-50 text-indigo-700",
      isCustom: true
    };

    setSegments([...segments, newSegment]);
    setCustomSegmentName("");
    setCustomCriteria({ type: "spending", minAmount: 0 });
    setDialog(false);
    toast.success("Segment created");
  };

  const handleDeleteSegment = (id) => {
    if (segments.find(s => s.id === id)?.isCustom) {
      setSegments(segments.filter(s => s.id !== id));
      toast.success("Segment deleted");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Customer Segmentation</h1>
          <p className="text-sm text-slate-500 mt-1">Organize customers into targeted segments for precision marketing</p>
        </div>
        <Button onClick={() => { setCustomSegmentName(""); setCustomCriteria({ type: "spending", minAmount: 0 }); setDialog(true); }} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          <Plus className="w-4 h-4" /> Create Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {segmentStats.map(segment => (
          <Card key={segment.id} className={`border-slate-100 cursor-pointer hover:shadow-lg transition-all ${segment.color}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${segment.color}`}>
                    <segment.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{segment.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{segment.description}</p>
                  </div>
                </div>
                {segment.isCustom && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteSegment(segment.id)}
                    className="h-7 w-7 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{segment.count}</p>
                  <p className="text-xs text-slate-500 mt-1">customer{segment.count !== 1 ? 's' : ''}</p>
                </div>
                <Badge className="bg-white/20 text-slate-700">
                  {segment.count > 0 ? `${Math.round((segment.count / customers.length) * 100)}%` : "0%"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Details */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Segment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {segmentStats.map(segment => (
              <div key={segment.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <segment.icon className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{segment.name}</p>
                    <p className="text-xs text-slate-500">{segment.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{segment.count}</p>
                  <p className="text-xs text-slate-500">{customers.length > 0 ? Math.round((segment.count / customers.length) * 100) : 0}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Custom Segment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Segment Name *</Label>
              <Input
                value={customSegmentName}
                onChange={e => setCustomSegmentName(e.target.value)}
                className="mt-1"
                placeholder="e.g., Mid-tier Customers"
              />
            </div>
            <div>
              <Label>Criteria Type</Label>
              <Select value={customCriteria.type} onValueChange={type => setCustomCriteria({ ...customCriteria, type })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spending">By Spending</SelectItem>
                  <SelectItem value="recency">By Recency</SelectItem>
                  <SelectItem value="location">By Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customCriteria.type === "spending" && (
              <div>
                <Label>Minimum Spending (ZMW)</Label>
                <Input
                  type="number"
                  value={customCriteria.minAmount}
                  onChange={e => setCustomCriteria({ ...customCriteria, minAmount: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  placeholder="e.g., 100000"
                />
              </div>
            )}

            {customCriteria.type === "recency" && (
              <div>
                <Label>Days Since Join</Label>
                <Input
                  type="number"
                  value={customCriteria.days || 30}
                  onChange={e => setCustomCriteria({ ...customCriteria, days: parseInt(e.target.value) || 30 })}
                  className="mt-1"
                  placeholder="e.g., 30"
                />
              </div>
            )}

            {customCriteria.type === "location" && (
              <p className="text-xs text-slate-500">Location segments can be configured from the details view after creation.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCustomSegment} className="bg-blue-600 hover:bg-blue-700">Create Segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}