import React, { useState } from 'react';
import { Container, Title, TextInput, PasswordInput, Button, Paper, Text, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Layout, useStyles } from '../components/layout';

export function LoginPage() {
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await fetch('http://localhost:5000/loginuser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Log the user in if it succeeded, otherwise return an error
    if (response.ok) {
      const data = await response.json();
      const token = data.token;
      setError('');

      // Store the token in the local storage
      localStorage.setItem('token', token);

      const authenticationResponse = await fetch('http://localhost:5000/authenticate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      // If the response is successful, navigate to the logged-in homepage
      if (authenticationResponse.ok) {
        localStorage.setItem('email', email)
        navigate('/dashboard');
      } else {
        setError("Authentication failed. Please try again.")
      }
    } else {
      const errorData = await response.json();
      setError(errorData.message)
    }
  };

  const handleForgotPassword = async () => {
    navigate('/forgot-password');
  };

  return (
    <Layout>
      <Container size="xs" mt={60}>
        <Title order={2} ta="center" mt="xl" style={styles.title}>Log in</Title>
        
        {error && <p style={{ color: "red" }}>{error}</p>}

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput
            label="Email address"
            placeholder="hello@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            styles={{ input: styles.input }}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            styles={{ input: styles.input }}
          />
          <Button fullWidth mt="xl" style={styles.primaryButton} onClick={handleLogin}>
            Log In
          </Button>

          <Text size="sm" mt="xs">
            <Anchor style={{ color: 'darkblue'}} onClick={handleForgotPassword}>
              Forgot password
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </Layout>
  );
}
