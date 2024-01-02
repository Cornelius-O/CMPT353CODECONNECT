import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserContext';
import './Channel.css';
import Likes from'./Like'

function ChannelMessages({ channelId, onRefresh }) {
    const [messages, setMessages] = useState([]);
    const [replies, setReplies] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [messageImage, setMessageImage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [newReply, setNewReply] = useState('');
    const [replyImage, setReplyImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');

    useEffect(() => {
        fetchMessagesAndReplies();
    }, [channelId]);

    const { userId } = useUserContext();

    const fetchMessagesAndReplies = () => {
        fetch(`http://localhost:8080/getChannelMessages/${channelId}`)
            .then(response => response.json())
            .then(data => {
                setMessages(data);
                fetchRepliesForMessages(data);
            })
            .catch(error => console.error('Error fetching messages:', error));
    };

    const fetchRepliesForMessages = (messages) => {
        messages.forEach(message => {
            fetch(`http://localhost:8080/getReplies/${message.message_id}`)
                .then(response => response.json())
                .then(replyData => {
                    setReplies(prevReplies => ({ ...prevReplies, [message.message_id]: replyData }));
                })
                .catch(error => console.error('Error fetching replies:', error));
        });
    };

    const handlePostMessage = () => {
        if (!newMessage.trim()) {
            alert('Please enter a message');
            return;
        }

        const formData = new FormData();
        formData.append('channelId', channelId);
        formData.append('userId', userId);
        formData.append('content', newMessage);
        if (messageImage) {
            formData.append('image', messageImage);
        }

        fetch('http://localhost:8080/postMessage', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (response.ok) {
                    setNewMessage('');
                    setMessageImage(null);

                    setTimeout(() => {
                        fetch(`http://localhost:8080/getChannelMessages/${channelId}`)
                            .then(response => response.json())
                            .then(data => setMessages(data))
                            .catch(error => console.error('Error fetching messages:', error));
                    }, 1000);
                } else {
                    alert('Error posting message');
                }
            })
            .catch(error => {
                console.error('Error posting message:', error);
            });
    };

    const handlePostReply = (messageId) => {
        if (!newReply.trim()) {
            alert('Please enter a reply');
            return;
        }

        const formData = new FormData();
        formData.append('messageId', messageId);
        formData.append('userId', userId);
        formData.append('content', newReply);
        if (replyImage) {
            formData.append('image', replyImage);
        }

        fetch('http://localhost:8080/postReply', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (response.ok) {
                    setNewReply('');
                    setReplyImage(null);
                    setReplyingTo(null);

                    setTimeout(() => {
                        fetch(`http://localhost:8080/getChannelMessages/${channelId}`)
                            .then(response => response.json())
                            .then(data => setMessages(data))
                            .catch(error => console.error('Error fetching messages:', error));
                    }, 1000);
                } else {
                    alert('Error posting reply');
                }
            })
            .catch(error => {
                console.error('Error posting reply:', error);
            });
    };
    
    

    const filteredMessages = messages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        message.username.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <div className="messages-container">
            <h4>Messages</h4>
            <input
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input
                type="text"
                placeholder="Search users"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <button onClick={() => setSearchQuery('')}>Clear Search</button>
            {filteredMessages.map((message) => (
                <div key={message.message_id} className="message">
                    <p className="message-info">
                        <span className="username">Sent by - {message.username}</span>
                        <Likes></Likes>
                        <span className="timestamp">Sent at - {new Date(message.timestamp).toLocaleString()}</span>
                    </p>
                    <p className="message-content">{message.content}</p>
                    {message.image_path && (
                        <img src={`http://localhost:8080/${message.image_path}`} alt="Message Screenshot" />
                    )}
                    <button onClick={() => setReplyingTo(message.message_id)}>Reply</button>
                    {replyingTo === message.message_id && (
                        <div className="reply-input">
                            <textarea
                                rows="2"
                                value={newReply}
                                onChange={e => setNewReply(e.target.value)}
                                placeholder="Type a reply"
                            />
                            <input
                                type="file"
                                onChange={(e) => setReplyImage(e.target.files[0])}
                            />
                            <button onClick={() => handlePostReply(message.message_id)}>Post Reply</button>
                        </div>
                    )}
                    {replies[message.message_id] && replies[message.message_id].map(reply => (
                        <div key={reply.reply_id} className="reply">
                            <p className="reply-info">
                                <span className="reply-username">Replied by - {reply.username}</span>
                                {/* <span className="reply-timestamp">Replied at - {new Date(reply.timestamp).toLocaleString()}</span> */}
                            </p>

                            <p className="reply-content">{reply.content}</p>
                            {reply.reply_image_path && (
                                <img className="reply-image" src={`http://localhost:8080/${reply.reply_image_path}`} alt="Reply Screenshot" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
            <div className="message-input">
                <textarea
                    rows="4"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                />
                <input
                    type="file"
                    onChange={(e) => setMessageImage(e.target.files[0])}
                />
                <button onClick={handlePostMessage}>Post</button>
            </div>
        </div>
    );
}

function Channel() {
    const [channelName, setChannelName] = useState('');
    const [channels, setChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [channelSearchQuery, setChannelSearchQuery] = useState('');
    const [creatorSearchQuery, setCreatorSearchQuery] = useState('');

    useEffect(() => {
        fetchChannels();
    }, [refresh]);

    const { userId } = useUserContext();

    const fetchChannels = () => {
        fetch('http://localhost:8080/channels')
            .then(response => response.json())
            .then(data => setChannels(data))
            .catch(error => console.error('Error fetching channels:', error));
    };

    const handleCreateChannel = (userId) => {
        if (!channelName) {
            alert('Please enter a channel name');
            return;
        }

        fetch('http://localhost:8080/createChannel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: channelName, userId: userId }),
        })
            .then(response => response.json())
            .then(newChannelData => {
                setChannels(prevChannels => [...prevChannels, newChannelData]);
                setChannelName(''); // Reset the input field
                setRefresh(true); // Trigger refresh
                setTimeout(() => {
                    setRefresh(false); // Disable refresh after a delay
                }, 2000); // Delay time
            })
            .catch(error => {
                console.error('Error creating channel:', error);
            });
    };

    const handleChannelSelect = channelId => {
        setSelectedChannelId(channelId);
    };

    const filteredChannels = channels.filter((channel) =>
        channel.channel_name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) &&
        channel.creator_name?.toLowerCase().includes(creatorSearchQuery.toLowerCase())
    );

    return (
        <div className="channel-container">
            <div className="sidebar">
                <div className="create-channel">
                    <input
                        type="text"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        placeholder="Channel Name"
                    />
                    <button onClick={() => handleCreateChannel(userId)}>Create</button>
                </div>
                <h3>Available Channels</h3>
                <input
                    type="text"
                    placeholder="Search channels"
                    value={channelSearchQuery}
                    onChange={(e) => setChannelSearchQuery(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Search creators"
                    value={creatorSearchQuery}
                    onChange={(e) => setCreatorSearchQuery(e.target.value)}
                />
                <ul className="channel-list">
                    {filteredChannels.map(channel => (
                        <li
                            key={channel.channel_id}
                            onClick={() => handleChannelSelect(channel.channel_id)}
                            className={selectedChannelId === channel.channel_id ? 'active' : ''}
                        >
                            {`${channel.channel_name} - Created by ${channel.creator_name}`}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="main-content">
                {selectedChannelId && (
                    <>
                        <h3>Selected Channel: {channels.find(channel => channel.channel_id === selectedChannelId)?.channel_name}</h3>
                        <ChannelMessages channelId={selectedChannelId} onRefresh={() => setRefresh(true)} />
                    </>
                )}
            </div>
        </div>
    );
}

export default Channel;
