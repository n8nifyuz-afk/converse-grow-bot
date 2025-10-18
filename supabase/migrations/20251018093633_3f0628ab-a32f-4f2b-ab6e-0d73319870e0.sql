-- Update existing claude-sonnet-4 model references to claude-haiku-4.5
UPDATE chats 
SET model_id = 'claude-haiku-4.5' 
WHERE model_id = 'claude-sonnet-4';

UPDATE messages 
SET model = 'claude-haiku-4.5' 
WHERE model = 'claude-sonnet-4';

UPDATE token_usage 
SET model = 'claude-haiku-4.5' 
WHERE model = 'claude-sonnet-4';