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
import Modal from '@cloudscape-design/components/modal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

interface TransactionItem {
  id: number;
}

export default function TransactionLoadPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/transactions');

  // Table state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Truncate confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/transactions');
      setTransactions(response.data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load transactions.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleClear = async () => {
    setClearing(true);
    setFeedback(null);
    try {
      await apiClient.delete('/api/transactions/truncate');
      setFeedback({ type: 'success', message: 'All records from Transact Table deleted successfully.' });
      setShowClearModal(false);
      await fetchTransactions();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to truncate Transact Table.' });
    } finally {
      setClearing(false);
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
              if (window.confirm('Are you sure you want to delete all records?')) {
                apiClient.delete('/api/database/clean').then(() => {
                  setFeedback({ type: 'success', message: 'Database cleaned successfully.' });
                }).catch(() => {
                  setFeedback({ type: 'error', message: 'Failed to clean database.' });
                });
              }
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
            { type: 'link', text: 'Transactions', href: '/transactions' },
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

          <Container header={<Header variant="h2">File Browser</Header>}>
            <SpaceBetween size="m">
              <input type="file" accept=".xls,.xlsx" />
              <Button onClick={() => setShowClearModal(true)} loading={clearing}>
                Clear
              </Button>
            </SpaceBetween>
          </Container>

          <Table
            columnDefinitions={[
              { id: 'id', header: 'Id', cell: (item) => item.id },
            ]}
            items={transactions}
            loading={loading}
            loadingText="Loading transactions..."
            empty={<Box textAlign="center">No records found.</Box>}
            header={<Header counter={`(${transactions.length})`}>Transaction Data</Header>}
          />

          <Modal
            visible={showClearModal}
            onDismiss={() => setShowClearModal(false)}
            header="Confirm Delete"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowClearModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" loading={clearing} onClick={handleClear}>
                    Yes
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            Are you sure you want to delete all records from Transact Table?
          </Modal>
        </SpaceBetween>
      }
      toolsHide
      contentType="table"
    />
  );
}
