// sdaw/types/chat.ts
export type MessageMetadata = {
    // MODIFIED: Made call-specific properties optional
    callerId?: string;
    receiverId?: string;
    callType?: 'video' | 'voice'; 
    
    actionType: 'offer' | 'trade_proposal' | 'item_request';
    itemName: string;
    itemImage?: string;
    itemPrice?: number | null;
    offerAmount?: number;
    message?: string;
    actionStatus?: 'pending' | 'accepted' | 'declined';
};

export type Message = {
    id: number;
    created_at: string;
    conversation_id: number;
    sender_id: string;
    message_text: string;
    read_at: string | null;
    // 👇 This line needs to include 'deleted'
    message_type: 'text' | 'image' | 'offer' | 'trade_proposal' | 'item_request' | 'system' | 'missed_call' | 'deleted';
    image_url: string | null;
    metadata: MessageMetadata | null;
    temp_id?: string;
};