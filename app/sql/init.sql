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

    -- Create welcome message
    INSERT INTO god.god_chat_messages (
        conversation_id,
        user_content,
        ai_content,
        created_at
    ) VALUES (
        new_conversation_id,
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