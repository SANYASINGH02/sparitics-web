import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

interface UserItem {
  userID: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  userType: string;
}

const userTypeOptions = [
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'USER', value: 'USER' },
];

export default function UserManagementPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeHref, setActiveHref] = useState('/users/manage');

  // Form state
  const [userID, setUserID] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<{ label: string; value: string } | null>(null);

  // Table state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const clearForm = () => {
    setUserID('');
    setFullName('');
    setPhoneNumber('');
    setPassword('');
    setUserType(null);
    setSelectedItems([]);
  };

  const handleAddUser = async () => {
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiClient.post('/api/users', {
        userID,
        fullName,
        phoneNumber,
        password,
        userType: userType?.value ?? '',
      });
      setFeedback({ type: 'success', message: 'User added successfully.' });
      clearForm();
      await fetchUsers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string; missingFields?: string[] } } };
        const status = axiosErr.response?.status;
        if (status === 400) {
          const missing = axiosErr.response?.data?.missingFields;
          setFeedback({ type: 'error', message: missing ? `Missing fields: ${missing.join(', ')}` : 'Please fill in all required fields.' });
        } else if (status === 409) {
          setFeedback({ type: 'error', message: axiosErr.response?.data?.message || 'User already exists.' });
        } else {
          setFeedback({ type: 'error', message: 'Failed to add user.' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiClient.put(`/api/users/${userID}`, {
        fullName,
        phoneNumber,
        password,
        userType: userType?.value ?? '',
      });
      setFeedback({ type: 'success', message: 'User updated successfully.' });
      clearForm();
      await fetchUsers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 404) {
          setFeedback({ type: 'error', message: axiosErr.response?.data?.message || 'User not found.' });
        } else {
          setFeedback({ type: 'error', message: 'Failed to update user.' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiClient.delete(`/api/users/${userID}`);
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
      clearForm();
      await fetchUsers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 404) {
          setFeedback({ type: 'error', message: axiosErr.response?.data?.message || 'User not found.' });
        } else {
          setFeedback({ type: 'error', message: 'Failed to delete user.' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Unable to connect to the server.' });
      }
    } finally {
      setSubmitting(false);
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

          <Container header={<Header variant="h2">User Form</Header>}>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" loading={submitting} onClick={handleAddUser}>
                    Add User
                  </Button>
                  <Button loading={submitting} onClick={handleUpdateUser}>
                    Update
                  </Button>
                  <Button loading={submitting} onClick={handleDeleteUser}>
                    Delete
                  </Button>
                  <Button variant="link" onClick={clearForm}>
                    Clear
                  </Button>
                </SpaceBetween>
              }
            >
              <SpaceBetween direction="vertical" size="l">
                <FormField label="UserID">
                  <Input value={userID} onChange={({ detail }) => setUserID(detail.value)} placeholder="Enter UserID" />
                </FormField>
                <FormField label="Full Name">
                  <Input value={fullName} onChange={({ detail }) => setFullName(detail.value)} placeholder="Enter Full Name" />
                </FormField>
                <FormField label="Phone Number">
                  <Input value={phoneNumber} onChange={({ detail }) => setPhoneNumber(detail.value)} placeholder="Enter Phone Number" />
                </FormField>
                <FormField label="Password">
                  <Input value={password} onChange={({ detail }) => setPassword(detail.value)} placeholder="Enter Password" />
                </FormField>
                <FormField label="User Type">
                  <Select
                    selectedOption={userType}
                    onChange={({ detail }) => setUserType(detail.selectedOption as { label: string; value: string })}
                    options={userTypeOptions}
                    placeholder="Select User Type"
                  />
                </FormField>
              </SpaceBetween>
            </Form>
          </Container>

          <Table
            columnDefinitions={[
              { id: 'userID', header: 'User ID', cell: (item) => item.userID },
              { id: 'fullName', header: 'Full Name', cell: (item) => item.fullName },
              { id: 'phoneNumber', header: 'Phone Number', cell: (item) => item.phoneNumber },
              { id: 'password', header: 'Password', cell: (item) => item.password },
              { id: 'userType', header: 'User Type', cell: (item) => item.userType },
            ]}
            items={users}
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => {
              setSelectedItems(detail.selectedItems);
              if (detail.selectedItems.length > 0) {
                const user = detail.selectedItems[0];
                setUserID(user.userID);
                setFullName(user.fullName);
                setPhoneNumber(user.phoneNumber);
                setPassword(user.password);
                setUserType(
                  userTypeOptions.find((opt) => opt.value === user.userType) ?? null
                );
              }
            }}
            loading={loading}
            loadingText="Loading users..."
            empty={<Box textAlign="center">No users found</Box>}
            header={<Header counter={`(${users.length})`}>Users</Header>}
          />
        </SpaceBetween>
      }
      toolsHide
      contentType="table"
    />
  );
}
