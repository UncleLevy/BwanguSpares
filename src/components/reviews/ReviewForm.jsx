import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ReviewForm({ onSubmit, submitting, type = "shop" }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm text-slate-700 mb-2 block">
          How would you rate this {type}?
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  (hover || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm text-slate-700">Your Review (optional)</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="mt-1 rounded-xl"
          rows={3}
        />
      </div>
      <Button
        type="submit"
        disabled={rating === 0 || submitting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}