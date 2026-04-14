import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Autosuggest from '@cloudscape-design/components/autosuggest';
import Button from '@cloudscape-design/components/button';
import Checkbox from '@cloudscape-design/components/checkbox';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import MultiLocationDialog from '../components/MultiLocationDialog';

function parseBarcode(raw: string): { partNumber: string; quantity: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let idx = trimmed.length - 1;
  while (idx >= 0 && /\d/.test(trimmed[idx])) idx--;
  if (idx < trimmed.length - 1) {
    const partNumber = trimmed.substring(0, idx + 1);
    const qty = parseInt(trimmed.substring(idx + 1), 10);
    return { partNumber, quantity: isNaN(qty) ? 1 : qty };
  }
  return { partNumber: trimmed, quantity: 1 };
}

const REMARK_OPTIONS = [
  { label: '', value: '' },
  { label: 'Damaged Part', value: 'Damaged Part' },
  { label: 'PartNumber Doubtful', value: 'PartNumber Doubtful' },
  { label: 'Without Packing Label', value: 'Without Packing Label' },
];

export default function CountingInterfacePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/counting/interface');

  // Mode
  const [isManualMode, setIsManualMode] = useState(false);

  // Fields
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [remark, setRemark] = useState<{ label: string; value: string }>({ label: '', value: '' });

  // Autocomplete suggestions
  const [partSuggestions, setPartSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<{ location: string; finalQty: number }[]>([]);

  // Part description & warnings
  const [partDescription, setPartDescription] = useState('');
  const [partNotFound, setPartNotFound] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Multi-location dialog
  const [showMultiLocation, setShowMultiLocation] = useState(false);
  const [multiLocationPartNumber, setMultiLocationPartNumber] = useState('');

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount and when switching modes
  useEffect(() => {
    if (!isManualMode) {
      barcodeInputRef.current?.focus();
    }
  }, [isManualMode]);

  // Lookup part description when partNumber changes
  const lookupPartDescription = useCallback(async (pn: string) => {
    if (!pn.trim()) {
      setPartDescription('');
      setPartNotFound(false);
      return;
    }
    try {
      const response = await apiClient.get(`/api/parts/lookup?partNumber=${encodeURIComponent(pn.trim())}`);
      const data = response.data;
      if (data && data.partDescription) {
        setPartDescription(data.partDescription);
        setPartNotFound(false);
      } else {
        setPartDescription('');
        setPartNotFound(true);
      }
    } catch {
      setPartDescription('');
      setPartNotFound(true);
    }
  }, []);

  // Check if part+location already counted
  const checkAlreadyCounted = useCallback(async (pn: string, loc: string) => {
    if (!pn.trim() || !loc.trim()) {
      setWarningMessage('');
      return;
    }
    try {
      const response = await apiClient.get(`/api/counting/locations?partNumber=${encodeURIComponent(pn.trim())}`);
      const locations: { location: string; finalQty: number }[] = response.data;
      const match = locations.find((l) => l.location === loc.trim());
      if (match) {
        setWarningMessage(
          `Warning: Part Number '${pn.trim()}' is already counted at Location '${loc.trim()}' with Quantity ${match.finalQty}`
        );
      } else {
        setWarningMessage('');
      }
    } catch {
      setWarningMessage('');
    }
  }, []);

  // Fetch location suggestions when location field is focused
  const fetchLocationSuggestions = useCallback(async (pn: string) => {
    if (!pn.trim()) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const response = await apiClient.get(`/api/counting/locations?partNumber=${encodeURIComponent(pn.trim())}`);
      setLocationSuggestions(response.data);
    } catch {
      setLocationSuggestions([]);
    }
  }, []);

  // Autocomplete for manual mode
  const handlePartAutocomplete = async (value: string) => {
    setPartNumber(value);
    setPartDescription('');
    setPartNotFound(false);
    setWarningMessage('');
    if (value.trim().length >= 2) {
      try {
        const response = await apiClient.get(`/api/parts/autocomplete?query=${encodeURIComponent(value.trim())}`);
        setPartSuggestions(response.data);
      } catch {
        setPartSuggestions([]);
      }
    } else {
      setPartSuggestions([]);
    }
  };

  // Handle barcode scan (Enter key in hidden input)
  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = (e.target as HTMLInputElement).value;
      const result = parseBarcode(raw);
      if (!result) {
        setFeedback({ type: 'error', message: 'Empty barcode scanned.' });
        (e.target as HTMLInputElement).value = '';
        return;
      }
      setPartNumber(result.partNumber);
      setQuantity(String(result.quantity));
      lookupPartDescription(result.partNumber);
      // Check if part exists in tblCounting — if so, open multi-location dialog
      try {
        const response = await apiClient.get(
          `/api/counting/locations?partNumber=${encodeURIComponent(result.partNumber.trim())}`
        );
        const locations: { location: string; finalQty: number }[] = response.data;
        if (locations.length > 0) {
          setMultiLocationPartNumber(result.partNumber.trim());
          setShowMultiLocation(true);
        }
      } catch {
        // ignore
      }
      // Clear the hidden input
      (e.target as HTMLInputElement).value = '';
    }
  };

  // Handle part number selection in manual mode
  const handlePartSelect = (value: string) => {
    setPartNumber(value);
    lookupPartDescription(value);
  };

  // Handle part number blur — check already counted + lookup description + open multi-location
  const handlePartNumberBlur = async () => {
    if (partNumber.trim()) {
      lookupPartDescription(partNumber);
      if (location.trim()) {
        checkAlreadyCounted(partNumber, location);
      }
      // Check if part exists in tblCounting — if so, open multi-location dialog
      try {
        const response = await apiClient.get(
          `/api/counting/locations?partNumber=${encodeURIComponent(partNumber.trim())}`
        );
        const locations: { location: string; finalQty: number }[] = response.data;
        if (locations.length > 0) {
          setMultiLocationPartNumber(partNumber.trim());
          setShowMultiLocation(true);
        }
      } catch {
        // ignore — non-critical check
      }
    }
  };

  // Handle location blur — check already counted
  const handleLocationBlur = () => {
    if (partNumber.trim() && location.trim()) {
      checkAlreadyCounted(partNumber, location);
    }
  };

  // Handle location focus — fetch suggestions
  const handleLocationFocus = () => {
    fetchLocationSuggestions(partNumber);
  };

  // Submit counting
  const handleSubmit = async () => {
    // Validate
    if (!partNumber.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a Part Number.' });
      return;
    }
    if (!quantity.trim() || isNaN(Number(quantity))) {
      setFeedback({ type: 'error', message: 'Please enter a valid Quantity.' });
      return;
    }
    if (!location.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a Location.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await apiClient.post('/api/counting', {
        partNumber: partNumber.trim(),
        quantity: Number(quantity),
        location: location.trim(),
        countingMode: isManualMode ? 'Manual' : 'Barcode',
        remark: remark.value,
      });
      const data = response.data;
      if (data.duplicate) {
        setFeedback({
          type: 'success',
          message: `Record updated. Previous quantity was ${data.existingQuantity}.`,
        });
      } else {
        setFeedback({ type: 'success', message: data.message || 'Record inserted successfully.' });
      }
      // Clear fields (keep location)
      setPartNumber('');
      setQuantity('');
      setRemark({ label: '', value: '' });
      setPartDescription('');
      setPartNotFound(false);
      setWarningMessage('');
      // Re-focus
      if (!isManualMode) {
        barcodeInputRef.current?.focus();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { missingFields?: string[] } } };
      if (error.response?.data?.missingFields) {
        setFeedback({
          type: 'error',
          message: `Missing fields: ${error.response.data.missingFields.join(', ')}`,
        });
      } else {
        setFeedback({ type: 'error', message: 'Failed to submit counting record.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reset all fields
  const handleReset = () => {
    setPartNumber('');
    setQuantity('');
    setLocation('');
    setRemark({ label: '', value: '' });
    setPartDescription('');
    setPartNotFound(false);
    setWarningMessage('');
    setFeedback(null);
    if (!isManualMode) {
      barcodeInputRef.current?.focus();
    }
  };

  // Close — navigate back
  const handleClose = () => {
    navigate('/counting');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout
      navigation={
        <SideNavigation
          activeHref={activeHref}
          header={{ text: 'Sparitics', href: '/user' }}
          onFollow={(event) => {
            event.preventDefault();
            const href = event.detail.href;
            setActiveHref(href);
            if (href === '#logout') {
              handleLogout();
            } else {
              navigate(href);
            }
          }}
          items={[
            { type: 'link', text: 'Part Import', href: '/parts/import' },
            { type: 'link', text: 'Manage Users', href: '/users/manage' },
            { type: 'link', text: 'Start Counting', href: '/counting' },
            { type: 'divider' },
            { type: 'link', text: 'Logout', href: '#logout' },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          {feedback && (
            <Alert type={feedback.type} dismissible onDismiss={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          )}

          <Container header={<Header variant="h2">Counting Interface</Header>}>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" loading={submitting} onClick={handleSubmit}>
                    Submit
                  </Button>
                  <Button onClick={handleReset}>Reset</Button>
                  <Button onClick={handleClose}>Close</Button>
                </SpaceBetween>
              }
            >
              <SpaceBetween size="l">
                {/* Mode Toggle */}
                <Checkbox
                  checked={isManualMode}
                  onChange={({ detail }) => {
                    setIsManualMode(detail.checked);
                    setPartNumber('');
                    setQuantity('');
                    setPartDescription('');
                    setPartNotFound(false);
                    setWarningMessage('');
                  }}
                >
                  Count Manually
                </Checkbox>

                {/* Hidden barcode input for barcode mode */}
                {!isManualMode && (
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    onKeyDown={handleBarcodeKeyDown}
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      opacity: 0,
                      width: '1px',
                      height: '1px',
                    }}
                    aria-label="Barcode scanner input"
                  />
                )}

                {/* Part Number */}
                <FormField label="Part Number">
                  {isManualMode ? (
                    <Autosuggest
                      value={partNumber}
                      onChange={({ detail }) => handlePartAutocomplete(detail.value)}
                      onSelect={({ detail }) => handlePartSelect(detail.value)}
                      onBlur={handlePartNumberBlur}
                      options={partSuggestions.map((s) => ({ value: s }))}
                      placeholder="Type part number..."
                      empty="No matches found"
                    />
                  ) : (
                    <Input value={partNumber} disabled onChange={() => {}} placeholder="Scan barcode..." />
                  )}
                </FormField>

                {/* Quantity */}
                <FormField label="Quantity">
                  <Input
                    value={quantity}
                    type="number"
                    onChange={({ detail }) => setQuantity(detail.value)}
                    placeholder="Enter quantity"
                  />
                </FormField>

                {/* Location */}
                <FormField label="Location">
                  <Autosuggest
                    value={location}
                    onChange={({ detail }) => setLocation(detail.value)}
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                    onSelect={({ detail }) => {
                      // Extract location from "LOC → Qty: N" format
                      const match = detail.value.match(/^(.+?)\s*→/);
                      if (match) {
                        setLocation(match[1].trim());
                      } else {
                        setLocation(detail.value);
                      }
                    }}
                    options={locationSuggestions.map((l) => ({
                      value: `${l.location} → Qty: ${l.finalQty}`,
                    }))}
                    placeholder="Enter location"
                    empty="No existing locations"
                  />
                </FormField>

                {/* Remarks */}
                <FormField label="Remarks">
                  <Select
                    selectedOption={remark}
                    onChange={({ detail }) =>
                      setRemark(detail.selectedOption as { label: string; value: string })
                    }
                    options={REMARK_OPTIONS}
                    placeholder="Select remark (optional)"
                  />
                </FormField>

                {/* Part Description */}
                {partDescription && (
                  <Box>
                    <Box variant="awsui-key-label">Part Description</Box>
                    <Box>{partDescription}</Box>
                  </Box>
                )}

                {/* Part not found warning */}
                {partNotFound && partNumber.trim() && (
                  <Box color="text-status-error" fontWeight="bold">
                    Part Number not found!
                  </Box>
                )}

                {/* Already counted warning */}
                {warningMessage && (
                  <Box color="text-status-error" fontWeight="bold">
                    {warningMessage}
                  </Box>
                )}
              </SpaceBetween>
            </Form>
          </Container>

          <MultiLocationDialog
            visible={showMultiLocation}
            partNumber={multiLocationPartNumber}
            onDismiss={() => setShowMultiLocation(false)}
            onSuccess={() => {
              // Refresh location suggestions if part number is still set
              if (partNumber.trim()) {
                fetchLocationSuggestions(partNumber);
              }
            }}
          />
        </SpaceBetween>
      }
      toolsHide
    />
  );
}
