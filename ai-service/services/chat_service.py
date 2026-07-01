from services.retrieval_service import retrieve_context
from services.prompt_service import assemble_messages
from services.stream_service import create_sse_response

async def handle_chat_stream(query: str, user_id: str, chat_id: str, history: list):
    """
    Main orchestration for a chat message:
    1. Retrieve relevant context from ChromaDB
    2. Assemble the full prompt (System + History + Context + Query)
    3. Stream the response using SSE
    """
    # 1. Retrieve Context
    context = retrieve_context(query, user_id, top_k=5)
    
    # 2. Assemble Messages
    messages = assemble_messages(query, context, history)
    
    # 3. Create Server-Sent Events stream
    return create_sse_response(messages)
