

import os
from flask import Flask, request, jsonify
from transformers import pipeline

# Initialize Flask app
app = Flask(__name__)

# Load the question-answering model
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

# Preload documentation (example: short summaries from official docs)
documentation = {
    "Segment": "Segment allows you to collect, clean, and control customer data. You can create sources, destinations, and event tracking.",
    "mParticle": "mParticle is a data platform to unify, process, and connect your customer data. Key features include user profiles, audience creation, and integrations.",
    "Lytics": "Lytics helps you build smarter audiences by analyzing customer data. Features include audience segmentation and machine learning insights.",
    "Zeotap": "Zeotap CDP empowers marketers to unify, analyze, and activate customer data securely. It provides integration, identity resolution, and activation tools."
}

# Endpoint to handle "how-to" questions
@app.route('/ask', methods=['POST'])
def answer_question():
    user_input = request.json.get("question")
    if not user_input:
        return jsonify({"error": "Question is required."}), 400

    # Determine the most relevant documentation
    best_match = max(documentation.items(), key=lambda item: qa_pipeline(question=user_input, context=item[1])['score'])

    # Generate an answer based on the best-matched documentation
    answer = qa_pipeline(question=user_input, context=best_match[1])

    return jsonify({
        "platform": best_match[0],
        "answer": answer['answer'],
        "confidence": answer['score']
    })

# Bonus: Compare functionalities across platforms
@app.route('/compare', methods=['POST'])
def compare_platforms():
    comparison_question = request.json.get("question")
    if not comparison_question:
        return jsonify({"error": "Comparison question is required."}), 400

    # Generate answers for each platform
    comparisons = {
        platform: qa_pipeline(question=comparison_question, context=doc)
        for platform, doc in documentation.items()
    }

    # Sort results by confidence
    sorted_comparisons = sorted(comparisons.items(), key=lambda item: item[1]['score'], reverse=True)

    return jsonify({
        "comparisons": [{"platform": item[0], "answer": item[1]['answer'], "confidence": item[1]['score']} for item in sorted_comparisons]
    })

if __name__ == '__main__':
    app.run(debug=True)
