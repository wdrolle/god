------------------------------------------------------------------------------
-- PART H3: CHAT TABLES
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS god.god_chat_conversations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES god.god_users(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT 'Chat_' || to_char(now() AT TIME ZONE 'utc+4', 'MM-DD-YYYY_HH12:MIAM'),
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4')
);

CREATE TABLE IF NOT EXISTS god.god_chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES god.god_chat_conversations(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4')
);

-- Optional indexes for chat
CREATE INDEX idx_god_chat_messages_conversation_id ON god.god_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS god_chat_messages_conversation_id_idx ON god.god_chat_messages (conversation_id);

-- Enable RLS for chat
ALTER TABLE god.god_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE god.god_chat_messages ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------------------------
-- CHAT RLS POLICIES
------------------------------------------------------------------------------
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON god.god_chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON god.god_chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON god.god_chat_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON god.god_chat_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON god.god_chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON god.god_chat_messages;

-- Conversation policies
CREATE POLICY "Users can view their own conversations"
    ON god.god_chat_conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
    ON god.god_chat_conversations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
    ON god.god_chat_conversations FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
    ON god.god_chat_conversations FOR DELETE
    USING (user_id = auth.uid());

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
    ON god.god_chat_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM god.god_chat_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON god.god_chat_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM god.god_chat_conversations WHERE user_id = auth.uid()
        )
    );

------------------------------------------------------------------------------
-- CHAT HELPER FUNCTIONS
------------------------------------------------------------------------------
-- Function to create a new chat
CREATE OR REPLACE FUNCTION god.create_chat_conversation(
    p_user_id UUID,
    p_title TEXT DEFAULT 'Chat_' || to_char(now() AT TIME ZONE 'utc+4', 'MM-DD-YYYY_HH12:MIAM')
) RETURNS god.god_chat_conversations
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_conversation god.god_chat_conversations;
BEGIN
    INSERT INTO god.god_chat_conversations (user_id, title)
    VALUES (p_user_id, p_title)
    RETURNING * INTO v_conversation;
    
    RETURN v_conversation;
END;
$$;

-- Function to add a message to the conversation
CREATE OR REPLACE FUNCTION god.add_chat_message(
    p_conversation_id UUID,
    p_messages JSONB
) RETURNS god.god_chat_messages
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_message god.god_chat_messages;
BEGIN
    -- Verify user owns the conversation
    IF NOT EXISTS (
        SELECT 1 FROM god.god_chat_conversations 
        WHERE id = p_conversation_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO god.god_chat_messages (
        conversation_id, 
        messages
    )
    VALUES (
        p_conversation_id,
        p_messages || jsonb_build_object('timestamp', now() AT TIME ZONE 'utc+4')
    )
    RETURNING * INTO v_message;
    
    RETURN v_message;
END;
$$;

-- Function to create initial chat conversation and message
CREATE OR REPLACE FUNCTION god.create_initial_chat()
RETURNS TRIGGER AS $$
DECLARE
    new_conversation_id UUID;
BEGIN
    -- Create initial conversation
    INSERT INTO god.god_chat_conversations (
        id,
        user_id,
        title,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        NEW.id,
        'Welcome to Bible Chat',
        NOW(),
        NOW()
    ) RETURNING id INTO new_conversation_id;

    -- Create welcome message with both user and AI messages in a single array
    INSERT INTO god.god_chat_messages (
        conversation_id,
        messages,
        created_at
    ) VALUES (
        new_conversation_id,
        jsonb_build_array(
            jsonb_build_object(
                'role', 'user',
                'content', 'How do I get closer to God?',
                'timestamp', NOW()
            ),
            jsonb_build_object(
                'role', 'assistant',
                'content', '"Come near to God and He will come near to you." (James 4:8)

Honest Prayer and Reflection
Spend intentional time talking to God. Share your worries, joys, and hopes with Him as you would with a friend who truly understands. Prayer is not just about speaking; it''s also about listening quietly for God''s gentle guidance. Take moments of silence where you simply wait and open your heart to His presence.

Engage with Scripture
The Bible is a primary way God reveals His character and promises. Reading even a few verses daily—particularly the Psalms or the Gospels—can help you sense God''s nearness. Reflect on what you read. Ask yourself, "How can I live out this truth right now?"

Practice Thanksgiving
Cultivate a habit of gratitude. Each day, name a few blessings or events that remind you of God''s goodness. By thanking God for both big and small gifts, you train your heart to recognize His presence in every season.

Find God in Community
While personal prayer is vital, it''s also important to connect with other believers—through local churches, Bible studies, or small groups. Hearing the stories and wisdom of fellow Christians helps you see God at work in diverse ways.

Seek Daily Obedience
Scripture frequently teaches that as we obey God''s commandments, we grow in our love and understanding of Him (John 14:15). Obedience is less about rigid rule-following and more about choosing to align your life with the love and goodness found in God''s heart.

Embrace Times of Stillness
In a fast-paced world, stillness is challenging. Yet, "Be still, and know that I am God" (Psalm 46:10) invites us to quiet our minds so we can experience God''s peace. Whether through silent prayer, journaling, or simply pausing in nature, stillness nurtures closeness with the Lord.

Remember God''s Faithfulness
As you look back on how God has led or comforted you in the past, your confidence in His nearness grows. This memory of His care renews your trust that He will continue guiding you forward.',
                'timestamp', NOW()
            )
        ),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE NOTICE 'Error creating initial chat: %', SQLERRM;
        -- Still return NEW to allow user creation to proceed
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS create_initial_chat_trigger ON god.god_users;
CREATE TRIGGER create_initial_chat_trigger
    AFTER INSERT ON god.god_users
    FOR EACH ROW
    EXECUTE FUNCTION god.create_initial_chat();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION god.create_initial_chat() TO authenticated;

------------------------------------------------------------------------------
-- CHAT PERMISSIONS
------------------------------------------------------------------------------
-- Grant access to tables
GRANT ALL ON god.god_chat_conversations TO authenticated;
GRANT ALL ON god.god_chat_messages TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION god.create_chat_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION god.add_chat_message TO authenticated;

-- Grant sequence usage if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA god TO authenticated;

CREATE POLICY "Allow user to update own conversations" 
ON god.god_chat_conversations 
FOR UPDATE 
USING (user_id = current_setting('jwt.claims.user_id')::uuid); 