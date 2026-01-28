'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format as formatDate } from 'date-fns';
import { CalendarIcon, Download, Loader2, FileJson, FileSpreadsheet, Archive } from 'lucide-react';
import { toast } from 'sonner';

type ExportFormat = 'json' | 'csv';
type ExportType = 'contacts' | 'landing_pages' | 'vault' | 'activities' | 'all';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function ExportPage() {
  const { currentWorkspace } = useWorkspace();
  const { canExport } = usePermissions();
  const [exportType, setExportType] = useState<ExportType>('contacts');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        workspace_id: currentWorkspace.id,
        type: exportType,
        format,
      });

      if (dateRange.from) {
        params.set('date_from', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.set('date_to', dateRange.to.toISOString());
      }
      if (includeMetadata) {
        params.set('include_metadata', 'true');
      }

      const res = await fetch(`/api/export?${params.toString()}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `${exportType}-export.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!canExport) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Export</h1>
          <p className="text-muted-foreground">Export your workspace data</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground text-center">
              You need admin or owner permissions to export data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-muted-foreground">
          Export your workspace data in JSON or CSV format
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>What to Export</CardTitle>
            <CardDescription>Select the data you want to export</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contacts" id="contacts" />
                <Label htmlFor="contacts" className="cursor-pointer">Contacts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landing_pages" id="landing_pages" />
                <Label htmlFor="landing_pages" className="cursor-pointer">Landing Pages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vault" id="vault" />
                <Label htmlFor="vault" className="cursor-pointer">Code Vault Items</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="activities" id="activities" />
                <Label htmlFor="activities" className="cursor-pointer">Activity Log</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer font-medium">
                  All Data (Full Backup)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Format Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Export Format</CardTitle>
            <CardDescription>Choose your preferred file format</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="cursor-pointer flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON (Recommended for backups)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" disabled={exportType === 'all'} />
                <Label 
                  htmlFor="csv" 
                  className={cn(
                    "cursor-pointer flex items-center gap-2",
                    exportType === 'all' && "opacity-50"
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (For spreadsheets)
                  {exportType === 'all' && (
                    <span className="text-xs text-muted-foreground">(Not available for full backup)</span>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range (Optional)</CardTitle>
            <CardDescription>Filter exported data by date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from
                        ? formatDate(dateRange.from, 'MMM d, yyyy')
                        : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to
                        ? formatDate(dateRange.to, 'MMM d, yyyy')
                        : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              >
                Clear dates
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Additional export settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
              />
              <Label htmlFor="metadata" className="cursor-pointer">
                Include metadata fields
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to export</p>
              <p className="text-sm text-muted-foreground">
                {exportType === 'all' 
                  ? 'Full workspace backup in JSON format'
                  : `Export ${exportType.replace('_', ' ')} as ${format.toUpperCase()}`
                }
              </p>
            </div>
            <Button onClick={handleExport} disabled={isExporting || !currentWorkspace}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
