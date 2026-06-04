"""
OpenAI service: wraps the chat completion call with tool-calling support.

Returns either a text response or triggers tool execution (loop handled in
conversation_service.py).
"""
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from loguru import logger
from app.core.config import get_settings
from app.tools.registry import TOOLS

settings = get_settings()
_client = AsyncOpenAI(api_key=settings.openai_api_key)

MAX_ITERATIONS = 10  # safety cap for tool-calling loops


async def chat(
    messages: list[ChatCompletionMessageParam],
    system_prompt: str,
    phone: str = "",
) -> tuple[str | None, list[dict]]:
    """
    Run the agent loop until a text response is produced or max iterations hit.

    Returns:
        (final_text, updated_messages_list)
    """
    full_messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": system_prompt},
        *messages,
    ]

    from app.tools.handlers import execute_tool

    for iteration in range(MAX_ITERATIONS):
        response = await _client.chat.completions.create(
            model=settings.openai_model,
            messages=full_messages,
            tools=TOOLS if TOOLS else None,
            tool_choice="auto" if TOOLS else None,
            max_tokens=settings.openai_max_tokens,
            temperature=settings.openai_temperature,
        )

        choice = response.choices[0]
        message = choice.message

        if choice.finish_reason == "tool_calls" and message.tool_calls:
            # Append assistant message with tool calls
            full_messages.append(message.model_dump(exclude_unset=True))

            # Execute each tool call
            for tc in message.tool_calls:
                logger.info(f"Tool call: {tc.function.name}({tc.function.arguments})")
                result = await execute_tool(
                    phone=phone,
                    tool_name=tc.function.name,
                    arguments_json=tc.function.arguments,
                )
                full_messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })
            continue  # next iteration with tool results

        # Text response
        text = (message.content or "").strip()
        # Return only the new messages (skip system prompt)
        new_messages = full_messages[1:]
        return text, new_messages

    logger.warning("Max iterations reached without final response")
    return None, messages
