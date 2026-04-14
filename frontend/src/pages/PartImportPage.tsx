import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Button from '@cloudscape-design/components/button';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import Modal from '@cloudscape-design/components/modal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

interface PartItem {
  id: number;
  partnumber: string;
  partnumber1: string;
  partDescription: string;
  category: string;
  landedcost: number;
  mrp: number | null;
  remark: string | null;
  moq: number | null;
}

export default function PartImportPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/parts/import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Table state
  const [parts, setParts] = useState<PartItem[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Truncate confirmation modal
  const [showTruncateModal, setShowTruncateModal] = useState(false);
  const [truncating, setTruncating] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoadingParts(true);
    try {
      const response = await apiClient.get('/api/parts');
      setParts(response.data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load parts.' });
    } finally {
      setLoadingParts(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleImport = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);
    setFeedback(null);
    try {
      const response = await apiClient.post('/api/parts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: response.data.message || 'Import successful.' });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchParts();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { message?: string; duplicates?: string[]; existing?: string[] };
          };
        };
        const status = axiosErr.response?.status;
        const data = axiosErr.response?.data;
        if (status === 400) {
          if (data?.duplicates && data.duplicates.length > 0) {
            setFeedback({
              type: 'error',
              message: `${data.message}: ${data.duplicates.join(', ')}`,
            });
          } else {
            setFeedback({ type: 'error', message: data?.message || 'Bad request.' });
          }
        } else if (status === 409) {
          if (data?.existing && data.existing.length > 0) {
            setFeedback({
              type: 'error',
              message: `${data.message}: ${data.existing.join(', ')}`,
            });
          } else {
            setFeedback({ type: 'error', message: data?.message || 'Conflict.' });
          }
        } else {
          setFeedback({ type: 'error', message: data?.message || 'Import failed.' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleTruncate = async () => {
    setTruncating(true);
    setFeedback(null);
    try {
      await apiClient.delete('/api/parts/truncate');
      setFeedback({ type: 'success', message: 'PartMaster table truncated successfully.' });
      setShowTruncateModal(false);
      await fetchParts();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to truncate PartMaster table.' });
    } finally {
      setTruncating(false);
    }
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
            { type: 'link', text: 'Clean Database', href: '#clean' },
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

          <Container header={<Header variant="h2">File Upload</Header>}>
            <SpaceBetween size="m">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  loading={uploading}
                  disabled={!selectedFile}
                  onClick={handleImport}
                >
                  Import
                </Button>
                <Button
                  loading={truncating}
                  onClick={() => setShowTruncateModal(true)}
                >
                  Clear / Truncate
                </Button>
              </SpaceBetween>
              {uploading && (
                <ProgressBar
                  status="in-progress"
                  label="Importing parts..."
                />
              )}
            </SpaceBetween>
          </Container>

          <Table
            columnDefinitions={[
              { id: 'partnumber', header: 'PartNumber', cell: (item) => item.partnumber },
              { id: 'partnumber1', header: 'PartNumber1', cell: (item) => item.partnumber1 },
              { id: 'partDescription', header: 'PartDescription', cell: (item) => item.partDescription },
              { id: 'category', header: 'Category', cell: (item) => item.category },
              { id: 'landedcost', header: 'LandedCost', cell: (item) => item.landedcost },
              { id: 'mrp', header: 'MRP', cell: (item) => item.mrp ?? '-' },
              { id: 'remark', header: 'Remark', cell: (item) => item.remark ?? '-' },
              { id: 'moq', header: 'MOQ', cell: (item) => item.moq ?? '-' },
            ]}
            items={parts}
            loading={loadingParts}
            loadingText="Loading parts..."
            empty={<Box textAlign="center">No parts found</Box>}
            header={<Header counter={`(${parts.length})`}>PartMaster Data</Header>}
          />

          <Modal
            visible={showTruncateModal}
            onDismiss={() => setShowTruncateModal(false)}
            header="Confirm Truncate"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowTruncateModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" loading={truncating} onClick={handleTruncate}>
                    Confirm
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            Are you sure you want to truncate the PartMaster table? This action cannot be undone.
          </Modal>
        </SpaceBetween>
      }
      toolsHide
    />
  );
}
