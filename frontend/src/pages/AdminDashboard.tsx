import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Modal from '@cloudscape-design/components/modal';
import Alert from '@cloudscape-design/components/alert';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

export default function AdminDashboard() {
  const { userID, logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/admin');
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCleanDatabase = async () => {
    setCleaning(true);
    setFeedback(null);
    try {
      await apiClient.delete('/api/database/clean');
      setFeedback({ type: 'success', message: 'Database cleaned successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to clean database. Please try again.' });
    } finally {
      setCleaning(false);
      setShowCleanModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    <AppLayout
      navigation={
        <SideNavigation
          activeHref={activeHref}
          header={{ text: 'Sparitics Admin', href: '/admin' }}
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
            { type: 'divider' },
            { type: 'link', text: 'Clean Database', href: '#clean' },
            { type: 'link', text: 'Logout', href: '#logout' },
          ]}
        />
      }
      content={
        <SpaceBetween size="l">
          {feedback && (
            <Alert
              type={feedback.type}
              dismissible
              onDismiss={() => setFeedback(null)}
            >
              {feedback.message}
            </Alert>
          )}
          <Container header={<Header variant="h1">Admin Dashboard</Header>}>
            <Box variant="p">
              Welcome, <strong>{userID}</strong>. Use the navigation menu to manage the system.
            </Box>
          </Container>
        </SpaceBetween>
      }
      toolsHide
    />

    {showCleanModal && (
      <Modal
        visible={showCleanModal}
        onDismiss={() => setShowCleanModal(false)}
        header="Clean Database"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCleanModal(false)}>
                No
              </Button>
              <Button variant="primary" loading={cleaning} onClick={handleCleanDatabase}>
                Yes
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete all records?
      </Modal>
    )}
  </>
  );
}
