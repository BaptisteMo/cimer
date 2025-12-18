'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];

interface CmrDetailsProps {
  cmr: CmrDocument;
}

export function CmrDetails({ cmr }: CmrDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">CMR Details</h1>
          <p className="text-muted-foreground">
            Created on {formatDate(cmr.created_at)}
          </p>
        </div>
        <Badge variant={cmr.status === 'completed' || cmr.status === 'completed_with_reserves' ? 'default' : 'secondary'}>
          {cmr.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>

      {/* Shipper Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipper Information</CardTitle>
          <CardDescription>Details of the sender</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-base">{cmr.shipper_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-base">{cmr.shipper_address || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Consignee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Consignee Information</CardTitle>
          <CardDescription>Details of the recipient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-base">{cmr.consignee_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-base">{cmr.consignee_address || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Goods Information */}
      <Card>
        <CardHeader>
          <CardTitle>Goods Information</CardTitle>
          <CardDescription>Details of the cargo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-base">{cmr.goods_description || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Packages</p>
              <p className="text-base">{cmr.packages_count || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p className="text-base">{cmr.weight_kg ? `${cmr.weight_kg} kg` : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport Information */}
      <Card>
        <CardHeader>
          <CardTitle>Transport Information</CardTitle>
          <CardDescription>Vehicle and route details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Loading Place</p>
            <p className="text-base">{cmr.loading_place}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Delivery Place</p>
            <p className="text-base">{cmr.delivery_place}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Loading Date</p>
            <p className="text-base">{formatDate(cmr.loading_date)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
