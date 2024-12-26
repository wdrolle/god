#!/bin/bash

# Check if .env file exists and source it
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    echo "Please create a .env file with the following variables:"
    echo "DATABASE_URL=your_database_url"
    exit 1
fi

# Extract connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in .env file"
    exit 1
fi

# Remove pgbouncer from the connection string if it exists
CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/\?pgbouncer=true//')

# Function to validate email format
validate_email() {
    if [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Prompt for email with validation
while true; do
    echo -n "Enter the email of the user to delete: "
    read email

    if validate_email "$email"; then
        break
    else
        echo "Invalid email format. Please try again."
    fi
done

# Confirm deletion
echo -n "Are you sure you want to delete user with email '$email'? (y/N): "
read confirmation

if [ "${confirmation,,}" != "y" ]; then
    echo "Operation cancelled."
    exit 0
fi

# SQL to delete user
SQL_SCRIPT=$(cat << EOF
BEGIN;

DO \$\$
DECLARE
    v_user_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- Retrieve the user_id and auth_user_id from god.god_users
    SELECT gu.id, gu.auth_user_id 
    INTO v_user_id, v_auth_user_id
    FROM god.god_users gu
    WHERE gu.email = '${email}';

    -- If no user found, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % does not exist', '${email}';
    END IF;

    -- Delete from god_chat_messages
    DELETE FROM god.god_chat_messages gcm
    WHERE gcm.conversation_id IN (
        SELECT gcc.id 
        FROM god.god_chat_conversations gcc 
        WHERE gcc.user_id = v_user_id
    );

    -- Delete from god_chat_conversations
    DELETE FROM god.god_chat_conversations gcc
    WHERE gcc.user_id = v_user_id;

    -- Delete from god_sent_messages
    DELETE FROM god.god_sent_messages gsm
    WHERE gsm.user_id = v_user_id;

    -- Delete from god_subscriptions
    DELETE FROM god.god_subscriptions gs
    WHERE gs.user_id = v_user_id;

    -- Delete from god_user_preferences
    DELETE FROM god.god_user_preferences gup
    WHERE gup.user_id = v_user_id;

    -- Delete from god_message_templates
    DELETE FROM god.god_message_templates gmt
    WHERE gmt.created_by = v_user_id;

    -- Delete from god_invitations
    DELETE FROM god.god_invitations gi
    WHERE gi.sent_by_id = v_user_id;

    -- Delete from god_users
    DELETE FROM god.god_users gu
    WHERE gu.id = v_user_id;

    -- Delete from auth.users if auth_user_id exists
    IF v_auth_user_id IS NOT NULL THEN
        DELETE FROM auth.users au
        WHERE au.id = v_auth_user_id;
    END IF;

    RAISE NOTICE 'Successfully deleted user with email: %', '${email}';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user %: %', '${email}', SQLERRM;
        RAISE;
END;
\$\$;

COMMIT;
EOF
)

# Execute the SQL script using the cleaned DATABASE_URL
echo "Deleting user..."
output=$(PGPASSWORD=$PGPASSWORD psql "$CLEAN_DATABASE_URL" -c "$SQL_SCRIPT" 2>&1)
exit_code=$?

echo "$output"

if [ $exit_code -eq 0 ]; then
    if [[ $output == *"Successfully deleted"* ]]; then
        echo "User successfully deleted."
        exit 0
    else
        echo "User deletion completed but success message not found."
        exit 1
    fi
else
    echo "An error occurred during user deletion."
    exit 1
fi 