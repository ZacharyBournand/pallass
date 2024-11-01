import React, { useState } from 'react';
import { Container, Title, Button, Group, Paper, ActionIcon, SimpleGrid, Text, Box, Modal } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Layout, useStyles } from '../components/layout';

interface Group {
  id: string;
  name: string;
}

interface ScheduledMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

export function LoggedInHomePage() {
  const styles = useStyles();
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'Group name 1' },
    { id: '2', name: 'Group name 2' },
  ]);
  const [groupToRemove, setGroupToRemove] = useState<Group | null>(null);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([
    { 
      id: '1', 
      title: 'Research Discussion',
      date: '2024-01-20',
      time: '14:00',
      type: 'meeting'
    },
  ]);

  const handleRemoveGroup = (group: Group) => {
    setGroupToRemove(group);
  };

  const confirmRemoveGroup = () => {
    if (groupToRemove) {
      setGroups(groups.filter(g => g.id !== groupToRemove.id));
      setGroupToRemove(null);
    }
  };

  return (
    <Layout>
      <Container size="lg">
        <SimpleGrid cols={2} spacing="xl">
          {/* Left column */}
          <Box>
            <Box mb="xl">
              <Title order={2} style={styles.title} mb="md">Your Groups</Title>
              <SimpleGrid cols={2} spacing="md" mb="md">
                {groups.map(group => (
                  <Paper key={group.id} p="md" withBorder style={{ position: 'relative' }}>
                    {group.name}
                    <ActionIcon
                      style={{ position: 'absolute', top: 5, right: 5 }}
                      size="sm"
                      onClick={() => handleRemoveGroup(group)}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Paper>
                ))}
              </SimpleGrid>
              <Group>
                <Button 
                  component={Link} 
                  to="/create-group" 
                  variant="subtle" 
                  color="violet"
                >
                  + Create group
                </Button>
                <Button 
                  component={Link} 
                  to="/join-group" 
                  variant="subtle" 
                  color="violet"
                >
                  + Join group
                </Button>
              </Group>
            </Box>

            <Box mb="xl">
              <Title order={3} mb="md" style={styles.title}>Discussion Forum threads you follow</Title>
              <SimpleGrid cols={2} spacing="md" mb="md">
                <Paper p="md" withBorder>Discussion forum name 1</Paper>
                <Paper p="md" withBorder>Discussion forum name 2</Paper>
              </SimpleGrid>
              <Group>
                <Button 
                  component={Link} 
                  to="/create-thread" 
                  variant="subtle" 
                  color="violet"
                >
                  + Create a thread
                </Button>
                <Button 
                  component={Link} 
                  to="/discover-threads" 
                  variant="subtle" 
                  color="violet"
                >
                  + Discover threads
                </Button>
              </Group>
            </Box>

            <Box mb="xl">
              <Title order={3} mb="md" style={styles.title}>Expert Q&A Sessions</Title>
              <Group>
                <Button 
                  component={Link} 
                  to="/host-qa" 
                  style={styles.primaryButton}
                >
                  Host Q&A session
                </Button>
                <Button 
                  component={Link} 
                  to="/join-qa" 
                  style={styles.primaryButton}
                >
                  Join Q&A session
                </Button>
              </Group>
            </Box>

            <Box mb="xl">
              <Title order={3} mb="md" style={styles.title}>Online Sessions</Title>
              <Group>
                <Button 
                  component={Link} 
                  to="/create-session" 
                  style={styles.primaryButton}
                >
                  Create Online Session
                </Button>
                <Button 
                  component={Link} 
                  to="/join-session" 
                  style={styles.primaryButton}
                >
                  Join Online Session
                </Button>
              </Group>
            </Box>

            <Box>
              <Title order={3} mb="md" style={styles.title}>Learn</Title>
              <Group>
                <Button style={styles.primaryButton}>Write about a topic</Button>
                <Button style={styles.primaryButton}>Learn about a topic</Button>
              </Group>
            </Box>

            <Modal
              opened={groupToRemove !== null}
              onClose={() => setGroupToRemove(null)}
              title="Confirm Group Removal"
              centered 
              size="sm" 
            >
              <Text>Are you sure you would like to leave the group "{groupToRemove?.name}"?</Text>
              <Group mt="md" align="right">
                <Button onClick={() => setGroupToRemove(null)} variant="outline">Cancel</Button>
                <Button onClick={confirmRemoveGroup} color="red">Leave Group</Button>
              </Group>
            </Modal>
          </Box>

          {/* Right column - Scheduled Meetings */}
          <Box>
            <Title order={2} style={styles.title} mb="md">Your Scheduled Sessions</Title>
            <Paper p="md" withBorder>
              {scheduledMeetings.length === 0 ? (
                <Text color="dimmed">No scheduled sessions</Text>
              ) : (
                scheduledMeetings.map(meeting => (
                  <Paper
                    key={meeting.id}
                    p="sm"
                    withBorder
                    mb="sm"
                    style={{
                      borderLeft: '4px solid #AB4D7C',
                    }}
                  >
                    <Text fw={500}>{meeting.title}</Text>
                    <Group justify="space-between" mt="xs">
                      <Text size="sm" color="dimmed">
                        {new Date(`${meeting.date} ${meeting.time}`).toLocaleString()}
                      </Text>
                      <Text size="sm" color="dimmed" styles={{ root: { textTransform: 'capitalize' } }}>
                        {meeting.type}
                      </Text>
                    </Group>
                  </Paper>
                ))
              )}
            </Paper>
          </Box>
        </SimpleGrid>
      </Container>
    </Layout>
  );
}