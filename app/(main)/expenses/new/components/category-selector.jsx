"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CategorySelector({ categories, value, onChange }) {
  const [internalCategory, setInternalCategory] = useState(value || "");

  useEffect(() => {
    if (value !== undefined && value !== internalCategory) {
      setInternalCategory(value);
    }
  }, [value]);

  // Set default value if not already set
  useEffect(() => {
    if (!value && !internalCategory && categories && categories.length > 0) {
      const defaultCategory =
        categories.find((cat) => cat.isDefault) || categories[0];
      setInternalCategory(defaultCategory.id);
      if (onChange) {
        onChange(defaultCategory.id);
      }
    }
  }, [categories, value, internalCategory, onChange]);

  const selectedCategory = value !== undefined && value !== "" ? value : internalCategory;

  // Handle when a category is selected
  const handleCategoryChange = (categoryId) => {
    setInternalCategory(categoryId);
    if (onChange) {
      onChange(categoryId);
    }
  };

  // If no categories or empty categories array
  if (!categories || categories.length === 0) {
    return <div>No categories available</div>;
  }

  return (
    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
