import { useState, useEffect, useCallback } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Table from '@cloudscape-design/components/table';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Header from '@cloudscape-design/components/header';
import apiClient from '../services/apiClient';

interface MultiLocationRow {
  id: number;
  partnumber: string;
  location: string;
  finalQty: number;
}

interface MultiLocationDialogProps {
  visible: boolean;
  partNumber: string;
  onDismiss: () => void;
  onSuccess: () => void;
}

export default function MultiLocationDialog({
  visible,
  partNumber,
  onDismiss,
  onSuccess,
}: MultiLocationDialogProps) {
  const [rows, setRows] = useState<MultiLocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [changedQuantities, setChangedQuantities] = useState<Map<number, string>>(new Map());

  const fetchRows = useCallback(async () => {
    if (!partNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(
        `/api/counting/multi-location?partNumber=${encodeURIComponent(partNumber.trim())}`
      );
      setRows(response.data);
    } catch {
      setError('Failed to load multi-location data.');
    } finally {
      setLoading(false);
    }
  }, [partNumber]);

  useEffect(() => {
    if (visible) {
      setChangedQuantities(new Map());
      setError('');
      fetchRows();
    }
  }, [visible, fetchRows]);

  const handleQuantityChange = (id: number, value: string) => {
    // Only accept digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    setChangedQuantities((prev) => {
      const next = new Map(prev);
      if (value === '') {
        next.delete(id);
      } else {
        next.set(id, value);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (changedQuantities.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const updates = Array.from(changedQuantities.entries()).map(([id, qty]) => ({
        id,
        finalQty: Number(qty),
      }));
      await apiClient.put('/api/counting/multi-location', updates);
      onSuccess();
      onDismiss();
    } catch {
      setError('Failed to update quantities. Transaction was rolled back.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={<Header>Multi-Location: {partNumber}</Header>}
      size="large"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Close
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={changedQuantities.size === 0}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="s">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        <Table
          columnDefinitions={[
            { id: 'id', header: 'ID', cell: (item) => item.id },
            { id: 'partnumber', header: 'PartNumber', cell: (item) => item.partnumber },
            { id: 'location', header: 'Location', cell: (item) => item.location },
            { id: 'finalQty', header: 'Final_Qty', cell: (item) => item.finalQty },
            {
              id: 'changeQuantity',
              header: 'Change Quantity',
              cell: (item) => (
                <Input
                  type="number"
                  value={changedQuantities.get(item.id) ?? ''}
                  onChange={({ detail }) => handleQuantityChange(item.id, detail.value)}
                  placeholder="New qty"
                />
              ),
            },
          ]}
          items={rows}
          loading={loading}
          loadingText="Loading locations..."
          empty={<Box textAlign="center">No locations found for this part number</Box>}
        />
      </SpaceBetween>
    </Modal>
  );
}
