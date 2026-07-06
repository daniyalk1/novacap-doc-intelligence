from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()

class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def generate(self, question: str, context_chunks: list[dict]) -> dict:
        if not context_chunks:
            return {
                "answer": "I could not find relevant information in the documents.",
                "sources": []
            }

        context = "\n\n".join([
            f"[Source: {c['filename']}, Chunk {c['chunk_id']}]\n{c['content']}"
            for c in context_chunks
        ])

        prompt = f"""You are a helpful assistant for NovaCap Bank employees.
Answer the question based only on the context provided.
If the answer is not in the context, say "I don't have enough information to answer that."
Always mention which document your answer comes from.

Context:
{context}

Question: {question}
"""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for NovaCap Bank."},
                {"role": "user", "content": prompt}
            ]
        )

        sources = list(set([c["filename"] for c in context_chunks]))

        return {
            "answer": response.choices[0].message.content,
            "sources": sources
        }