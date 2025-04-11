import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Ruler, ArrowRight, Grid } from "lucide-react";

export interface MeasurementGridItem {
  size: string;
  measurements: {
    [key: string]: string;
  };
}

interface MeasurementGridProps {
  value: MeasurementGridItem[];
  onChange: (value: MeasurementGridItem[]) => void;
  disabled?: boolean;
}

export function MeasurementGrid({ value = [], onChange, disabled }: MeasurementGridProps) {
  // Ensure value is always an array of MeasurementGridItem
  const safeValue: MeasurementGridItem[] = Array.isArray(value) ? value : [];
  
  const [measurements, setMeasurements] = useState<string[]>(
    safeValue.length > 0 && safeValue[0]?.measurements
      ? Object.keys(safeValue[0].measurements)
      : ["Chest", "Waist", "Length"]
  );

  const handleAddSize = () => {
    const newMeasurement: MeasurementGridItem = {
      size: "",
      measurements: {},
    };
    
    // Initialize measurement properties
    measurements.forEach(measurement => {
      newMeasurement.measurements[measurement] = "";
    });
    
    onChange([...safeValue, newMeasurement]);
  };

  const handleRemoveSize = (index: number) => {
    const newValue = [...safeValue];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleSizeChange = (index: number, size: string) => {
    const newValue = [...safeValue];
    newValue[index].size = size;
    onChange(newValue);
  };

  const handleMeasurementChange = (sizeIndex: number, measurement: string, measurementValue: string) => {
    const newValue = [...safeValue];
    newValue[sizeIndex].measurements[measurement] = measurementValue;
    onChange(newValue);
  };

  const handleAddMeasurement = () => {
    const newMeasurement = `Measurement ${measurements.length + 1}`;
    setMeasurements([...measurements, newMeasurement]);
    
    // Add the new measurement to all existing sizes
    const newValue = safeValue.map(item => ({
      ...item,
      measurements: {
        ...item.measurements,
        [newMeasurement]: ""
      }
    }));
    
    onChange(newValue);
  };

  const handleRemoveMeasurement = (measurement: string) => {
    const newMeasurements = measurements.filter(m => m !== measurement);
    setMeasurements(newMeasurements);
    
    // Remove the measurement from all sizes
    const newValue = safeValue.map(item => {
      const { [measurement]: _, ...rest } = item.measurements;
      return {
        ...item,
        measurements: rest
      };
    });
    
    onChange(newValue);
  };

  const handleChangeMeasurementName = (oldName: string, newName: string) => {
    const newMeasurements = measurements.map(m => m === oldName ? newName : m);
    setMeasurements(newMeasurements);
    
    // Update the measurement name in all sizes
    const newValue = safeValue.map(item => {
      const { [oldName]: measurementValue, ...rest } = item.measurements;
      return {
        ...item,
        measurements: {
          ...rest,
          [newName]: measurementValue || ""
        }
      };
    });
    
    onChange(newValue);
  };

  return (
    <Card className="w-full border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Grid className="h-5 w-5" />
          <span>Measurement Grid</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMeasurement}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Ruler className="h-4 w-4" />
              <span>Add Measurement</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSize}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Size</span>
            </Button>
          </div>

          {value.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Size</TableHead>
                    {measurements.map((measurement, index) => (
                      <TableHead key={index} className="min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Input
                            value={measurement}
                            onChange={(e) => handleChangeMeasurementName(measurement, e.target.value)}
                            className="h-8 py-1"
                            disabled={disabled}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMeasurement(measurement)}
                            disabled={disabled || measurements.length <= 1}
                            className="h-8 w-8"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {value.map((item, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell>
                        <Input
                          value={item.size}
                          onChange={(e) => handleSizeChange(rowIndex, e.target.value)}
                          placeholder="e.g. S, M, L"
                          className="h-8 py-1"
                          disabled={disabled}
                        />
                      </TableCell>
                      {measurements.map((measurement, colIndex) => (
                        <TableCell key={colIndex}>
                          <Input
                            value={item.measurements[measurement] || ""}
                            onChange={(e) => handleMeasurementChange(rowIndex, measurement, e.target.value)}
                            placeholder="0.0 in"
                            className="h-8 py-1"
                            disabled={disabled}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSize(rowIndex)}
                          disabled={disabled || value.length <= 1}
                          className="h-8 w-8"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {value.length === 0 && (
            <div className="border rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground">
              <Grid className="h-12 w-12 mb-2 opacity-20" />
              <p>No sizes added yet</p>
              <p className="text-sm">Add a size to create a measurement grid</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}