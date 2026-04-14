import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

const userTypeOptions = [
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'USER', value: 'USER' },
];

export default function LoginPage() {
  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<{ label: string; value: string } | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleReset = () => {
    setUserID('');
    setPassword('');
    setUserType(null);
    setPasscode('');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/login', {
        userID,
        password,
        userType: userType?.value ?? '',
        passcode,
      });
      const { token } = response.data;
      const selectedType = userType?.value ?? '';
      login(token, userID, selectedType);
      navigate(selectedType === 'ADMIN' ? '/admin' : '/user');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosErr.response?.status;
        const message = axiosErr.response?.data?.message;
        if (status === 400) {
          setError(message || 'Please fill in all required fields.');
        } else if (status === 401) {
          setError(message || 'Authentication failed.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('Unable to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding={{ top: 'xxxl' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <Container header={<Header variant="h1">Sparitics Login</Header>}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="primary" loading={loading} onClick={handleSubmit}>
                  Login
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              {error && <Alert type="error">{error}</Alert>}
              <FormField label="UserID">
                <Input value={userID} onChange={({ detail }) => setUserID(detail.value)} placeholder="Enter UserID" />
              </FormField>
              <FormField label="Password">
                <Input
                  value={password}
                  onChange={({ detail }) => setPassword(detail.value)}
                  type="password"
                  placeholder="Enter Password"
                />
              </FormField>
              <FormField label="User Type">
                <Select
                  selectedOption={userType}
                  onChange={({ detail }) => setUserType(detail.selectedOption as { label: string; value: string })}
                  options={userTypeOptions}
                  placeholder="Select User Type"
                />
              </FormField>
              <FormField label="Passcode">
                <Input
                  value={passcode}
                  onChange={({ detail }) => setPasscode(detail.value)}
                  placeholder="Enter Daily Passcode"
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Container>
      </div>
    </Box>
  );
}
