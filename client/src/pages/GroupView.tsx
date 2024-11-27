import React, { useState, useEffect, useRef } from 'react';
import { Container, Title as MantineTitle, Text, Image, Title, Paper, Button, Textarea, Group, Box, Card, Modal, Divider, Loader, Stack, TextInput, Notification } from '@mantine/core';
import { Layout, useStyles } from '@/components/layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { EditorConsumer } from '@tiptap/react';
import { IconVideo } from '@tabler/icons-react';

interface User {
  id: string;
  name: string;
}

interface Reply {
  id: string;
  author: User;
  date: string;
  content: string;
}

interface Message extends Reply {
  replies: Reply[];
}

interface Message {
  id: string,
  sender: string,
  content: string,
  date: string,
  type: string,
  reply: string,
  replyingmsgid: string,
  replyingmsgsender: string,
  replyingmsgcontent: string,
  replyingmsgdate: string,
}

interface ChosenGroup {
  GroupID: string,
  GroupName: string,
  GroupDescription: string,
  GroupUuid: string,
  GroupCreatedAt: string,
  GroupMessageID: string,
  GroupMessageFirstname: string,
  GroupMessageLastname: string,
  GroupMessageGroupID: string,
  GroupMessageContent: string,
  GroupMessageCreatedAt: string,
  ReplyID: string,
  ReplyFirstname: string,
  ReplyLastname: string,
  ReplyContent: string,
  ReplyCreatedAt: string,
  UserFullname: string,
}

interface GroupMember {
  ID: string,
	GroupID: string,
	UserEmail: string,
	Role: string,
	JoinedAt: string,
	Firstname: string,
	Lastname: string,
}

export function GroupView() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  // States for message reply
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [replyingToMessageSender, setReplyingToMessageSender] = useState<string | null>(null);
  const [replyingToMessageContent, setReplyingToMessageContent] = useState<string | null>(null);
  const [replyingToMessageDate, setReplyingToMessageDate] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [groupData, setGroupData] = useState<ChosenGroup[] | null>(null);
  const [userName, setUserName] = useState('');
  const [membersModalOpened, setMembersModalOpened] = useState(false);
  const [deleteConfirmationModalOpened, setDeleteConfirmationModalOpened] = useState(false);
  const [addMemberModalOpened, setAddMemberModalOpened] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupOwner, setGroupOwner] = useState('');
  const [newMember, setNewMember] = useState('');
  const [newMemberAdded, setNewMemberAdded] = useState(false)
  const [newMemberNotAdded, setNewMemberNotAdded] = useState(false)
  const addMembersButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteGroupButtonRef = useRef<HTMLButtonElement | null>(null);


  const email = localStorage.getItem('email');
  // Get the JWT token
  const token = localStorage.getItem('token');

  const ws = useRef<WebSocket | null>(null);
  const groupID = localStorage.getItem("groupID");
  console.log("groupID: ", groupID)
  var getUserName = "";

  const fetchGroup = async() => {
    // Get the discussion group's information (including its messages)
    const fetchGroupData = async () => {
      const response = await fetch(`http://localhost:5000/groups/${groupID}`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
      });
  
      // Check if the response is ok (status code 200-299)
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log("data: ", data)

      for (let i = 0; i < data[0].MemberEmails.length; i++) {
        console.log("data[0].MemberEmails[i]: ", data[0].MemberEmails[i])

        if (email == data[0].MemberEmails[i]) {
          for (let i = 0; i < data[0].MemberEmails.length; i++) {
            if (data[0].MemberRoles[i] == "Owner") {
              setGroupOwner(data[0].MemberEmails[i])
            }
          }
    
          setGroupData(data);
        }
      }
    }
    
    fetchGroupData();
    // fetchArticles();

    // Websocket connection
    ws.current = new WebSocket(`ws://localhost:5000/wsgroup/${email}`)

    ws.current.onopen = () => {
        console.log("Websocket connected");
    }

    // Handle incoming messages from the WebSocket server (i.e. when a user sends a message)
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Edit the message's content if the type is 'EDIT_MESSAGE'
      if (message.type === 'EDIT_MESSAGE') {
        // Edit the message (if it was a newly sent message)
        setMessages((prevMessages) => prevMessages.map((msg) => msg.id == message.id ? { ...msg, content : message.content } : msg));

        // Edit the message (if it was an older message displayed during the page initialization)
        setGroupData((prevMessages) => {
          if (prevMessages == null ) {
            return [];
          }

          const updatedGroupMessages = prevMessages.map((msg) => msg.GroupMessageID == message.id ? { ...msg, MessageContent : message.content } : msg);
          return updatedGroupMessages;
        })
      }
      // Remove the message and its nested replies if the type is 'DELETE_MESSAGE'
      else if (message.type === 'DELETE_MESSAGE') {
        // To delete a message and its nested replies that were newly sent
        const deleteNewMessageAndReplies = (messages: Message[], deletingMessageId: string): Message[] => {
          // Contain all messages that are going to be deleted
          const deletingMessages = new Set([deletingMessageId]);
      
          // Get all of the replies to the deleted messages
          const deletingReplies = (messageId: string) => {
            // Find the replies to the replies of the deleted message
            const replies = messages.filter((msg) => msg.replyingmsgid === messageId);
            replies.forEach((reply) => {
              deletingMessages.add(reply.id);
              deletingReplies(reply.id);
            });
          };
      
          // Recursion that starts from the deleted message
          deletingReplies(deletingMessageId);
      
          // Filter out all the messages that need to be deleted
          return messages.filter((msg) => !deletingMessages.has(msg.id));
        };

        // To delete a message and its nested replies that were displayed on page initialization
        const deleteOldMessageAndReplies = (messages: ChosenGroup[], deletingMessageId: string): ChosenGroup[] => {
          const deletingMessages = new Set([Number(deletingMessageId)]);
      
          const deletingReplies = (messageId: string) => {
            const replies = messages.filter((msg) => msg.ReplyID == messageId);
            replies.forEach((reply) => {
              deletingMessages.add(Number(reply.GroupMessageID));
              deletingReplies(reply.GroupMessageID);
            });
          };
      
          deletingReplies(deletingMessageId);
      
          return messages.filter((msg) => !deletingMessages.has(Number(msg.GroupMessageID)));
        };

        // Remove the deleted message and its nested replies (if it was a newly sent message)
        setMessages((prevMessages) => deleteNewMessageAndReplies(prevMessages, message.id));

        // Remove the deleted message and its nested replies (if it was an older message displayed during the page initialization)
        setGroupData((prevMessages) => {
          if (prevMessages == null ) {
            return [];
          }

          const updatedGroupMessages = deleteOldMessageAndReplies(prevMessages, message.id);
          return updatedGroupMessages;
        })
      }
      // Render the list of messages with the new message included 
      else {
        setMessages((prevMessages) => [...prevMessages, message]);
      } 
    };

    ws.current.onerror = (event) => {
        console.error("WebSocket error observed:", event);
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
        ws.current?.close();
    };
  }

  // Runs on initialization of the page
  useEffect(() => {
    fetchGroup();
    //fetchArticles();
  }, [email, groupID]);

  const sendMessage = async () => {
    // Get the sender's information
    const fullname = await fetch('http://localhost:5000/getUserName', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Check if the response is ok
    if (!fullname.ok) {
      throw new Error('Network response was not ok');
    }

    const userData = await fullname.json();
    const firstname = userData.Firstname
    const lastname = userData.Lastname
    getUserName = "" + firstname + " " + lastname

    const groupid = groupID
    const content = newMessage
    const replymessageid = replyingToMessageId

    // Store the message being sent
    const storeGroupMessage = await fetch('http://localhost:5000/storeGroupMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstname, lastname, groupid, content, replymessageid }),
    });

    if (!storeGroupMessage.ok) {
      throw new Error('Network response was not ok');
    }

    const groupMessageData = await storeGroupMessage.json()
    const messageID = "" + groupMessageData.ID + ""

    const message = { id: messageID, sender: getUserName, content: newMessage, date: groupMessageData.CreatedAt, reply: "false" } as Message;

    localStorage.setItem("localName", getUserName)

    const name = localStorage.getItem("localName")
    if (name != null) {
      setUserName(name)
    }

    // If the WebSocket connection exists, send the message through the WebSocket
    if (ws.current) {
      ws.current.send(JSON.stringify(message));
      setNewMessage('');
    } else {
        console.error("The WebSocket is uninitialized.");
    }
  };

  // Called when the user clicks on the 'Edit' button: enables the user to edit their message
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);    
  };

  const handleDeleteGroupMessage = async (messageId: string) => { 
    const response = await fetch(`http://localhost:5000/deleteGroupMessage/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const getMessageID = "" + messageId + ""

    // Delete the message with the corresponding message ID: "getMessageID"
    if (ws.current) {
      ws.current.send(JSON.stringify({ id: getMessageID, type: 'DELETE_MESSAGE', replyingmsgid: getMessageID }));
    }
  }

  // Save the edited message
  const handleSaveEdit = async (messageId: string, content: string) => {
    const id = "" + messageId + ""

    const response = await fetch(`http://localhost:5000/editGroupMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, content }),
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Edit the message with the corresponding message ID
    if (ws.current) {
      ws.current.send(JSON.stringify({id: id, content: content, type: 'EDIT_MESSAGE'}));
    }

    setEditingMessageId(null);
    setEditedContent('');
  };

  // Called when the user clicks on the 'Cancel' button: stops the editing interface
  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  // Called when the user clicks on the 'Reply' button: enables the user to reply to a message
  const handleReply = (messageId: string, messageSender: string, messageContent: string, messageDate: string) => {
    setReplyingToMessageId(messageId);
    setReplyingToMessageSender(messageSender)
    setReplyingToMessageContent(messageContent)
    setReplyingToMessageDate(messageDate)
  };

  // Post the reply
  const handlePostReply = async (messageId: string) => {
    // Get the sender's information
    const fullname = await fetch('http://localhost:5000/getUserName', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Check if the response is ok
    if (!fullname.ok) {
      throw new Error('Network response was not ok');
    }

    const userData = await fullname.json();
    const firstname = userData.Firstname
    const lastname = userData.Lastname
    getUserName = "" + firstname + " " + lastname

    const groupid = groupID
    const content = newMessage
    const replymessageid = "" + messageId + ""

    // Store the reply
    const storeGroupMessage = await fetch('http://localhost:5000/storeGroupMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstname, lastname, groupid, content, replymessageid }),
    });

    if (!storeGroupMessage.ok) {
      throw new Error('Network response was not ok');
    }

    const groupMessageData = await storeGroupMessage.json()
    const messageID = "" + groupMessageData.ID + ""
    const id = replymessageid

    console.log("id: ", id)

    // Get the information of the message being replied to
    const getGroupReplyingMessageData = await fetch('http://localhost:5000/getGroupReplyingMessageData', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    const replyingMessageData = await getGroupReplyingMessageData.json()
    console.log("replyingMessageData: ", replyingMessageData)
    const replyingMessageSender = replyingMessageData[0].Firstname + " " + replyingMessageData[0].Lastname
    const replyingMessageID = "" + replyingMessageData[0].ID + ""

    var message: Message

    // If the ID of the message being replied to exists, create an object containing a reply
    // Else, create an object containing a message that is not a reply
    if (replymessageid != null) {
      message = { 
        id: messageID, 
        sender: getUserName, 
        content: newMessage, 
        date: groupMessageData.CreatedAt, 
        reply: 'true',
        replyingmsgid: replyingMessageID,
        replyingmsgsender: replyingMessageSender,
        replyingmsgcontent: replyingMessageData[0].Content,
        replyingmsgdate: replyingMessageData[0].CreatedAt
      } as Message;
    } else {
      message = { id: messageID, sender: getUserName, content: newMessage, date: groupMessageData.CreatedAt, reply: 'false' } as Message;
    }

    localStorage.setItem("localName", getUserName)

    const name = localStorage.getItem("localName")
    if (name != null) {
      setUserName(name)
    }

    if (ws.current) {
      // Send the message
      ws.current.send(JSON.stringify(message));
      setNewMessage('');
    } else {
        console.error("The WebSocket is uninitialized.");
    }

    // Set the states for the message reply to null to end the reply interface
    setReplyingToMessageId(null)
    setReplyingToMessageSender(null)
    setReplyingToMessageContent(null)
    setReplyingToMessageDate(null)
  };

  // End the reply interface
  const handleCancelReply = () => {
    setReplyingToMessageId(null)
    setReplyingToMessageSender(null)
    setReplyingToMessageContent(null)
    setReplyingToMessageDate(null)
  }  

  // Handle the loading state
  if (!groupData) {
    return <div>Loading...</div>;
  }

  const openMembersList = async() => {
    const response = await fetch(`http://localhost:5000/getMembers`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupID }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log("data: ", data)
    setGroupMembers(data)
    setMembersModalOpened(true)

    console.log("Email: ", email)

    for (let i = 0; i < data.length; i++) {
      if (data[i].Role == "Owner") {
        setGroupOwner(data[i].UserEmail)
      }
    }
  }

  const closeMembersList = async() => {
    console.log("Members list")
    setMembersModalOpened(false)
  }

  // Kick a member out of the group
  const kickMemberOut = async(useremail: string) => {
    console.log("kickMemberOut()")

    console.log("groupID: ", groupID)
    console.log("useremail: ", useremail)

    const response = await fetch(`http://localhost:5000/exitGroup/${groupID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useremail }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    openMembersList()
  }

  const leaveGroup = async(useremail: string) => {
    console.log("leaveGroup()")

    console.log("groupID: ", groupID)
    console.log("useremail: ", useremail)

    const response = await fetch(`http://localhost:5000/exitGroup/${groupID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useremail }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    navigate("/dashboard")
  }

  const setNewOwner = async(email: string, useremail: string) => {
    console.log("setNewOwner()")

    console.log("groupID: ", groupID)
    console.log("useremail: ", useremail)

    const response = await fetch(`http://localhost:5000/changeOwner/${email}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupID, useremail }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    openMembersList()
  }

  const openAddMember = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).blur()
    
    if (addMembersButtonRef.current) {
      console.log("addMembersButtonRef")
      addMembersButtonRef.current.blur();
    }

    setAddMemberModalOpened(true)
  }

  const closeAddMember = () => {
    console.log("closeAddMember()")
    
    setAddMemberModalOpened(false)
    setNewMemberAdded(false)
    setNewMemberNotAdded(false)
  }

  const addMember = async(useremail: string) => {
    console.log("addMember()")

    setNewMemberAdded(false)
    setNewMemberNotAdded(false)
    
    const response = await fetch(`http://localhost:5000/addMember/${groupID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useremail }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      setNewMemberNotAdded(true)
    } else {
      setNewMemberAdded(true)
    }
  }

  const closeSuccessNotification = () => {
    setNewMemberAdded(false)
  }

  const closeErrorNotification = () => {
    setNewMemberNotAdded(false)
  }

  const openDeleteGroupVerification = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).blur()
    
    if (deleteGroupButtonRef.current) {
      console.log("deleteGroupButtonRef")
      deleteGroupButtonRef.current.blur();
    }

    setDeleteConfirmationModalOpened(true)
  }

  const closeDeleteGroupVerification = () => {
    console.log("closeDeleteGroupVerification()")

    setDeleteConfirmationModalOpened(false)
  }

  const confirmGroupDeletion = async() => {
    console.log("confirmGroupDeletion()")

    const response = await fetch(`http://localhost:5000/deleteGroup/${groupID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupID }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    navigate("/dashboard")
  }

  return (
    <Layout>
      <Link to="/dashboard" style={{ textDecoration: 'none', fontWeight: 'bold', color: 'black' }}>
        &lt; Back to Your Dashboard
      </Link>

      <Container size="lg" mt={30}>
        <Modal
          opened={membersModalOpened}
          onClose={closeMembersList}
          // Don't close the modal on a background click or on an Escape key click
          closeOnClickOutside={false}
          closeOnEscape={false} 
          size="lg"
          centered
          aria-modal="true"
        >
          <Title order={2} style={{ textAlign: "center", marginBottom: "20px" }}>Members</Title>

          <Stack>
            {/* If members list is empty or loading */}
            {groupMembers.length === 0 ? (
              <Loader variant="dots" />
            ) : (
              groupMembers.map((member, index) => (
                <React.Fragment key={index}>
                  <Group>
                    {/* Display member name */}
                    <Text>{member.Firstname} {member.Lastname}</Text>
                    <Text style={{ fontWeight: 500, color: 'darkblue', marginLeft: 20, marginRight: 80 }}>{member.Role}</Text>
                    {email == member.UserEmail && member.Role != "Owner" ? (
                      <Button style={{ textAlign: 'right', flex: 1 }} variant="subtle" color="red" onClick={() => leaveGroup(member.UserEmail)}>Leave</Button>
                    ) : (
                      null
                    )}

                    {email == groupOwner && email != member.UserEmail ? (
                      <Group>
                        <Button variant="subtle" color="red" onClick={() => setNewOwner(email, member.UserEmail)}>Set as Owner</Button>
                        <Button variant="subtle" color="red" onClick={() => kickMemberOut(member.UserEmail)}>Kick Out</Button>
                      </Group>
                    ) : (
                      null
                    )}
                  </Group>
                  {/* Add a Divider after each member except the last one */}
                  {index < groupMembers.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </Stack>
        </Modal>

        <Modal
          opened={addMemberModalOpened}
          onClose={closeAddMember}
          closeOnClickOutside={false}
          closeOnEscape={false} 
          size="lg"
          centered
          aria-modal="true"
        >
          <Stack align="center">
            <Text size="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 500, marginBottom: 15 }}>Enter the user's email address</Text>
            
            <Group>
              <TextInput
                placeholder="Email address"
                value={newMember}
                onChange={(event) => setNewMember(event.currentTarget.value)}
                style={{ width: '400px' }}
              />
              <Button color="red" onClick={() => addMember(newMember)}>Add Member</Button>
            </Group>
          </Stack>

          {newMemberAdded && (
            <Notification color="teal" title="Success!" mt="md" onClose={closeSuccessNotification}>
              The new member was successfully added to the group!
            </Notification>
          )}

          {newMemberNotAdded && (
            <Notification color="red" title="Error!" mt="md" onClose={closeErrorNotification}>
            Failed to add the user to the group. Please verify the email address.
          </Notification>
          )}
        </Modal>

        <Modal
          opened={deleteConfirmationModalOpened}
          onClose={closeDeleteGroupVerification}
          closeOnClickOutside={false}
          closeOnEscape={false} 
          size="lg"
          centered
          aria-modal="true"
        >
          {/* Stack the components one under the other and center them */}
          <Stack align="center">
            <Text size="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 500, marginBottom: 15 }}>Are you sure you want to delete this group?</Text>
            <Button color="red" onClick={confirmGroupDeletion}>Confirm Group Deletion</Button>
          </Stack>
        </Modal>

        {/* Group's title, description, and creation date */}
        <Paper 
          shadow="sm"
          radius="xl"
          style={{
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',  
            padding: '20px', 
            marginBottom: 30
          }}
         
        >
          <Group justify="space-between" align="center">
            <MantineTitle order={2} style={styles.title} mb="xs">
              {groupData[0].GroupName}
            </MantineTitle>

            <Group>
              {/* Members list button */}
              <Button variant="outline" color="teal" onClick={openMembersList}>
                Members
              </Button>

              {/* If the user is the group owner, display the 'Add Member' button */}
              {email == groupOwner && (
                <Button ref={addMembersButtonRef} variant="outline" color="cyan" onClick={openAddMember}>
                  Add Member
                </Button>
              )}
            </Group>
          </Group>
          
          <Group justify="space-between" align="center">
            <Text size="sm" color="dimmed">
              Created on: <strong>{new Date(groupData[0].GroupCreatedAt).toLocaleDateString()}</strong>
            </Text>
          </Group>

          <Text mb="lg" size="md" style={{ lineHeight: 1.6 }}>
            {groupData[0].GroupDescription}
          </Text>

          {/* If the user is the group owner, display the 'Delete Group' button */}
          {email == groupOwner && (
          <div style={{ textAlign: 'right' }}>
            {/* Delete group button */}
            <Button ref={deleteGroupButtonRef} variant="subtle" color="red" onClick={openDeleteGroupVerification}>
              Delete Group
            </Button>
          </div>
          )}
        </Paper>

        <Title order={3}>Messages</Title>
        {/* Messages displayed on page initialization */}
        <div style={{ paddingBottom: replyingToMessageId ? '220px' : '130px' }}>
          {groupData && groupData[0].GroupMessageID ? (
            groupData.map((groupMessage) => (
              <React.Fragment key={groupMessage.GroupMessageID}>
                {/* If the message is a reply, display the message being replied to */}
                {groupMessage.ReplyContent && (
                  <Card shadow="sm" padding="xs" radius="md" style={{ backgroundColor: '#D7C6B4', marginTop: '10px', ...(groupMessage.ReplyContent != '' ? { borderBottomLeftRadius: '0', borderBottomRightRadius: '0' } : {}) }}>
                    <Group>
                      <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <Text><span style={{ color: '#BE4BDB', fontWeight: 700, fontSize: 14 }}>Reply To </span> | <span style={{ fontSize: 12, fontWeight: 700 }}>{ groupMessage.ReplyFirstname } { groupMessage.ReplyLastname }</span> <span style={{ fontSize: 10, float: 'right' }}>{new Date(groupMessage.ReplyCreatedAt).toLocaleDateString()} {new Date(groupMessage.ReplyCreatedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>
                        <Text style={{ fontSize: 12 }}>{ groupMessage.ReplyContent }</Text>
                      </Box>
                    </Group>
                  </Card>
                )}

                <Card key={groupMessage.GroupMessageID} shadow="sm" padding="md" radius="md" style={{ backgroundColor: 'transparent', marginBottom: '10px', marginTop: '10px' }}>
                  <Group>
                    {/* Display the 'Edit' and 'Delete' buttons if the user is the one who sent the message */}
                    {groupMessage.GroupMessageFirstname + " " + groupMessage.GroupMessageLastname == groupData[0].UserFullname ? (
                      <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <Text><span style={{ fontWeight: 700 }}>{groupMessage.GroupMessageFirstname} {groupMessage.GroupMessageLastname}</span> <span style={{ fontWeight: 400, fontSize: 13, float: 'right' }}>{new Date(groupMessage.GroupMessageCreatedAt).toLocaleDateString()} {new Date(groupMessage.GroupMessageCreatedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>

                        {editingMessageId == groupMessage.GroupMessageID ? (
                          // In-place edit mode: Display a Textarea
                          <div style={{ flex: 1 }}>
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              placeholder="Edit your message"
                              autosize
                              styles={{
                                input: { backgroundColor: 'transparent' },
                              }}
                            />
                          </div>
                        ) : (
                          // Display message content normally
                          <Text style={{ flex: 1 }}>
                            {groupMessage.GroupMessageContent}
                          </Text>
                        )}

                        {editingMessageId == groupMessage.GroupMessageID ? (
                          // Show "Save" and "Cancel" buttons when editing
                          <>
                            <Button
                              onClick={() => handleSaveEdit(editingMessageId, editedContent)} 
                              variant="subtle" 
                              color="green" 
                              size="sm"
                              mt="sm"
                            >
                              Save
                            </Button>
                            <Button 
                              onClick={handleCancelEdit} 
                              variant="subtle" 
                              color="gray" 
                              size="sm"
                              mt="sm"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          // Show "Edit" button when not editing
                          <>
                            <Button 
                              onClick={() => handleEditMessage(groupMessage.GroupMessageID, groupMessage.GroupMessageContent)} 
                              variant="subtle" 
                              color="blue" 
                              size="sm"
                              mt="sm"
                            >
                              Edit
                            </Button>

                            <Button
                              onClick={() => handleReply(groupMessage.GroupMessageID, groupMessage.GroupMessageFirstname + " " + groupMessage.GroupMessageLastname, groupMessage.GroupMessageContent, groupMessage.GroupMessageCreatedAt)}
                              variant="subtle" 
                              color="grape" 
                              size="sm"
                              mt="sm"
                            >
                              Reply
                            </Button>

                            <Button 
                              onClick={() => handleDeleteGroupMessage(groupMessage.GroupMessageID)}
                              variant="subtle" 
                              color="red" 
                              size="sm"
                              mt="sm"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </Box>
                    ) : (
                      // Do not display the 'Edit' and 'Delete' buttons if the user is not the one who sent the message
                      <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <Text><span style={{ fontWeight: 700 }}>{groupMessage.GroupMessageFirstname} {groupMessage.GroupMessageLastname}</span> <span style={{ fontWeight: 400, fontSize: 13, float: 'right' }}>{new Date(groupMessage.GroupMessageCreatedAt).toLocaleDateString()} {new Date(groupMessage.GroupMessageCreatedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>
                        <Text style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{groupMessage.GroupMessageContent}</Text>

                        <Button 
                          onClick={() => handleReply(groupMessage.GroupMessageID, groupMessage.GroupMessageFirstname + " " + groupMessage.GroupMessageLastname, groupMessage.GroupMessageContent, groupMessage.GroupMessageCreatedAt)}
                          variant="subtle" 
                          color="grape" 
                          size="sm"
                          mt="sm"
                        >
                          Reply
                        </Button>
                      </Box>
                    )}
                  </Group>
                </Card>
              </React.Fragment>
            ))
          ) : (
            null
          )}

          {/* Messages sent in real-time by a user*/}
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {/* If the message is a reply, display the message being replied to */}
              {msg.reply == 'true' && (
                <Card shadow="sm" padding="xs" radius="md" style={{ backgroundColor: '#D7C6B4', marginTop: '10px', ...(msg.reply === 'true' ? { borderBottomLeftRadius: '0', borderBottomRightRadius: '0' } : {}) }}>
                  <Group>
                    <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <Text><span style={{ color: '#BE4BDB', fontWeight: 700, fontSize: 14 }}>Reply To </span> | <span style={{ fontSize: 12, fontWeight: 700 }}>{ msg.replyingmsgsender }</span> <span style={{ fontSize: 10, float: 'right' }}>{new Date(msg.replyingmsgdate).toLocaleDateString()} {new Date(msg.replyingmsgdate).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>
                      <Text style={{ fontSize: 12 }}>{ msg.replyingmsgcontent }</Text>
                    </Box>
                  </Group>
                </Card>
              )}

              <Card shadow="sm" padding="md" radius="md" style={{ backgroundColor: 'transparent', marginBottom: '10px', ...(msg.reply === 'true' ? { borderTopLeftRadius: '0', borderTopRightRadius: '0' } : { marginTop: '10px' }) }}>
                <Group>
                  {/* Display the 'Edit' and 'Delete' buttons if the user is the one who sent the message */}
                  {msg.sender == userName ? (
                    <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <Text><span style={{ fontWeight: 700 }}>{msg.sender}</span> <span style={{ fontWeight: 400, fontSize: 13, float: 'right' }}>{new Date(msg.date).toLocaleDateString()} {new Date(msg.date).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>

                      {editingMessageId == msg.id ? (
                        // In-place edit mode: Display a Textarea
                        <div style={{ flex: 1 }}>
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Edit your message"
                            autosize
                            styles={{
                              input: { backgroundColor: 'transparent' },
                            }}
                          />
                        </div>
                      ) : (
                        // Display message content normally
                        <Text style={{ flex: 1 }}>
                          {msg.content}
                        </Text>
                      )}

                      {editingMessageId == msg.id ? (
                        // Show "Save" and "Cancel" buttons when editing
                        <>
                          <Button
                            onClick={() => handleSaveEdit(editingMessageId, editedContent)} 
                            variant="subtle" 
                            color="green" 
                            size="sm"
                            mt="sm"
                          >
                            Save
                          </Button>

                          <Button 
                            onClick={handleCancelEdit}
                            variant="subtle"
                            color="gray"
                            size="sm"
                            mt="sm"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        // Show "Edit" button when not editing
                        <>
                          <Button 
                            onClick={() => handleEditMessage(msg.id, msg.content)}
                            variant="subtle" 
                            color="blue" 
                            size="sm"
                            mt="sm"
                          >
                            Edit
                          </Button>

                          <Button
                            onClick={() => handleReply(msg.id, msg.sender, msg.content, msg.date)}
                            variant="subtle" 
                            color="grape" 
                            size="sm"
                            mt="sm"
                          >
                            Reply
                          </Button>

                          <Button 
                            onClick={() => handleDeleteGroupMessage(msg.id)}
                            variant="subtle" 
                            color="red" 
                            size="sm"
                            mt="sm"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  ) : (
                    // Do not display the 'Edit' and 'Delete' buttons if the user is not the one who sent the message
                    <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      <Text><span style={{ fontWeight: 700 }}>{msg.sender}</span> <span style={{ fontWeight: 400, fontSize: 13, float: 'right' }}>{new Date(msg.date).toLocaleDateString()} {new Date(msg.date).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>
                      <Text style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{msg.content}</Text>

                      <Button 
                        onClick={() => handleReply(msg.id, msg.sender, msg.content, msg.date)}
                        variant="subtle" 
                        color="grape" 
                        size="sm"
                        mt="sm"
                      >
                        Reply
                      </Button>
                    </Box>
                  )}
                </Group>
              </Card>
            </React.Fragment>
          ))}
        </div>

        {/* User input for posting */}
        <Paper
          shadow="sm" 
          radius="md"
          mt="xl"
          p="md"
          withBorder

          style={{
            position: 'fixed',
            bottom: 0,
            width: '1108px',
          }}
        >
          { replyingToMessageId && replyingToMessageDate ? (
            // If the user is replying to a message, display the message the user is replying to
            <div>
              <Card shadow="sm" padding="xs" radius="md" style={{ backgroundColor: 'lightgray', marginTop: '10px', borderBottomLeftRadius: '0', borderBottomRightRadius: '0' }}>
                <Group>
                  <Box style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <Text><Button color='red' size='compact-xs' onClick={() => handleCancelReply()}>X</Button> <span style={{ color: '#BE4BDB', fontWeight: 700, fontSize: 14 }}>Replying To </span> | <span style={{ fontSize: 12, fontWeight: 700 }}>{replyingToMessageSender}</span> <span style={{ fontSize: 10, float: 'right' }}>{new Date(replyingToMessageDate).toLocaleDateString()} {new Date(replyingToMessageDate).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}</span></Text>
                    <Text style={{ fontSize: 12 }}>{replyingToMessageContent}</Text>
                  </Box>
                </Group>
              </Card>

              <Textarea
                placeholder="Your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.currentTarget.value)}
                minRows={3}
                mb="sm"
                radius="0"
              />

              <Button style={{ marginBottom: '10px' }} onClick={() => handlePostReply(replyingToMessageId)}>Post Message</Button>
            </div>
          ) : (
            <div>
              <Textarea
                placeholder="Your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.currentTarget.value)}
                minRows={3}
                mb="sm"
              />
              
              <Button style={{ marginBottom: '10px' }} onClick={sendMessage}>Post Message</Button>
            </div>
          ) }
        </Paper>
      </Container>
    </Layout>
  );
}
