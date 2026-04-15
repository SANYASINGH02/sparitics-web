import { useState, useEffect, useCallback } from 'react';
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
import Input from '@cloudscape-design/components/input';
import Autosuggest from '@cloudscape-design/components/autosuggest';
import Modal from '@cloudscape-design/components/modal';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

interface CountingItem {
  id: number;
  dealerId: number;
  userName: string;
  partnumber: string;
  location: string;
  partdesc: string;
  partPrice: number;
  count: number;
  category: string;
  remark: string;
  moq: number;
  notInPartMaster: string;
  dateadded: string;
  datemodi: string;
  recheckUser: string;
  recheckCount: number;
  recheckRemark: string;
  recheckDateadded: string;
  transactedPart: string;
  recheckFlag: string;
  finalQty: number;
  countingby: string;
  modicount: number;
}

export default function CountingDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/counting');

  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Table state
  const [countingItems, setCountingItems] = useState<CountingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CountingItem[]>([]);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clean database modal
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // Update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateRemark, setUpdateRemark] = useState('');
  const [updatePartNumber, setUpdatePartNumber] = useState('');
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchCounting = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/counting');
      setCountingItems(response.data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load counting records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounting();
  }, [fetchCounting]);

  const handleAutocomplete = async (value: string) => {
    setSearchValue(value);
    if (value.length >= 2) {
      try {
        const response = await apiClient.get(`/api/parts/autocomplete?query=${encodeURIComponent(value)}`);
        setSuggestions(response.data);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const response = await apiClient.get(`/api/counting/search?partNumber=${encodeURIComponent(searchValue)}`);
      setCountingItems(response.data);
    } catch {
      setFeedback({ type: 'error', message: 'Search failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowAll = async () => {
    setSearchValue('');
    setSuggestions([]);
    await fetchCounting();
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/counting/export', { responseType: 'blob' });
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = match ? match[1].replace(/['"]/g, '') : 'CountingExport.xlsx';
      saveAs(response.data, filename);
    } catch {
      setFeedback({ type: 'error', message: 'Export failed.' });
    }
  };

  const handleCleanDatabase = async () => {
    setCleaning(true);
    setFeedback(null);
    try {
      await apiClient.delete('/api/database/clean');
      setFeedback({ type: 'success', message: 'Database cleaned successfully.' });
      setShowCleanModal(false);
      setSelectedItems([]);
      await fetchCounting();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to clean database.' });
    } finally {
      setCleaning(false);
    }
  };

  const openUpdateModal = () => {
    if (selectedItems.length === 0) return;
    const item = selectedItems[0];
    setUpdateId(item.id);
    setUpdatePartNumber(item.partnumber);
    setUpdateLocation(item.location);
    setUpdateQuantity(String(item.finalQty));
    setUpdateRemark(item.remark);
    setShowUpdateModal(true);
  };

  const handleUpdate = async () => {
    if (updateId === null) return;
    setUpdating(true);
    setFeedback(null);
    try {
      await apiClient.put(`/api/counting/${updateId}`, {
        partNumber: updatePartNumber,
        location: updateLocation,
        quantity: Number(updateQuantity),
        remark: updateRemark,
      });
      setFeedback({ type: 'success', message: 'Record updated successfully.' });
      setShowUpdateModal(false);
      setSelectedItems([]);
      await fetchCounting();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update record.' });
    } finally {
      setUpdating(false);
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
            if (href === '#clean') {
              setShowCleanModal(true);
            } else if (href === '#logout') {
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

          <Container header={<Header variant="h2">Search</Header>}>
            <SpaceBetween direction="horizontal" size="xs">
              <Autosuggest
                value={searchValue}
                onChange={({ detail }) => handleAutocomplete(detail.value)}
                onSelect={({ detail }) => setSearchValue(detail.value)}
                options={suggestions.map((s) => ({ value: s }))}
                placeholder="Search Part Number..."
                empty="No matches found"
              />
              <Button variant="primary" onClick={handleSearch}>Search</Button>
              <Button onClick={handleShowAll}>Show All</Button>
            </SpaceBetween>
          </Container>

          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="primary" onClick={() => navigate('/counting/interface')}>Start Counting</Button>
            <Button disabled={selectedItems.length === 0} onClick={openUpdateModal}>Update</Button>
            <Button onClick={handleExport}>Export</Button>
            <Button onClick={() => setShowCleanModal(true)}>Clean Database</Button>
          </SpaceBetween>

          <Table
            columnDefinitions={[
              { id: 'id', header: 'ID', cell: (item) => item.id },
              { id: 'userName', header: 'UserName', cell: (item) => item.userName },
              { id: 'partnumber', header: 'PartNumber', cell: (item) => item.partnumber },
              { id: 'location', header: 'Location', cell: (item) => item.location },
              { id: 'partdesc', header: 'PartDesc', cell: (item) => item.partdesc },
              { id: 'partPrice', header: 'PartPrice', cell: (item) => item.partPrice },
              { id: 'count', header: 'Count', cell: (item) => item.count },
              { id: 'category', header: 'Category', cell: (item) => item.category },
              { id: 'remark', header: 'Remark', cell: (item) => item.remark },
              { id: 'moq', header: 'MOQ', cell: (item) => item.moq },
              { id: 'finalQty', header: 'Final_Qty', cell: (item) => item.finalQty },
              { id: 'countingby', header: 'CountingBy', cell: (item) => item.countingby },
              { id: 'modicount', header: 'ModiCount', cell: (item) => item.modicount },
              { id: 'dateadded', header: 'DateAdded', cell: (item) => item.dateadded },
            ]}
            items={countingItems}
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
            loading={loading}
            loadingText="Loading counting records..."
            empty={<Box textAlign="center">No counting records found</Box>}
            header={<Header counter={`(${countingItems.length})`}>Counting Data</Header>}
          />

          {/* Clean Database Confirmation Modal */}
          <Modal
            visible={showCleanModal}
            onDismiss={() => setShowCleanModal(false)}
            header="Confirm Clean Database"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowCleanModal(false)}>Cancel</Button>
                  <Button variant="primary" loading={cleaning} onClick={handleCleanDatabase}>Confirm</Button>
                </SpaceBetween>
              </Box>
            }
          >
            Are you sure you want to clean the database? This will truncate both PartMaster and tblCounting tables. This action cannot be undone.
          </Modal>

          {/* Update Form Modal */}
          <Modal
            visible={showUpdateModal}
            onDismiss={() => setShowUpdateModal(false)}
            header="Update Counting Record"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
                  <Button variant="primary" loading={updating} onClick={handleUpdate}>Submit</Button>
                </SpaceBetween>
              </Box>
            }
          >
            <SpaceBetween size="l">
              <Box>
                <Box variant="awsui-key-label">PartNumber</Box>
                <Input value={updatePartNumber} disabled onChange={() => {}} />
              </Box>
              <Box>
                <Box variant="awsui-key-label">Location</Box>
                <Input value={updateLocation} onChange={({ detail }) => setUpdateLocation(detail.value)} />
              </Box>
              <Box>
                <Box variant="awsui-key-label">Quantity</Box>
                <Input value={updateQuantity} type="number" onChange={({ detail }) => setUpdateQuantity(detail.value)} />
              </Box>
              <Box>
                <Box variant="awsui-key-label">Remark</Box>
                <Input value={updateRemark} onChange={({ detail }) => setUpdateRemark(detail.value)} />
              </Box>
            </SpaceBetween>
          </Modal>
        </SpaceBetween>
      }
      toolsHide
      contentType="table"
    />
  );
}
