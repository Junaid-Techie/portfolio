# Junaid Ahmed Mohammed

### Senior Data Engineer | AI Infrastructure Architect
**Indianapolis, IN**

[**Connect on LinkedIn**](https://www.linkedin.com/in/junaid-ahmed-mohammed-02321a95/) • [**Email Me**](mailto:mjunaidtechs@gmail.com) • [**View GitHub Profile**](https://github.com/Junaid-Techie)

---

## ⚡ Executive Summary

I am a **Senior Data Engineer (5+ YOE)** bridging the gap between distributed systems (**Snowflake, Spark**) and modern Generative AI workflows (**Agentic AI, RAG**). 

Unlike traditional data engineers, I don't just move data; I engineer the **intelligent infrastructure** that powers it. Currently, I am focused on the intersection of **Enterprise Data Governance** and **Local LLM Inference**, optimizing billion-parameter models to run efficiently on constrained hardware.

---

## 🛠️ The Tech Stack

| **Domain** | **Technologies** |
| :--- | :--- |
| **Generative AI** | LLaMA 3.2, Qwen 2.5, LangChain, Hugging Face, Unsloth, QLoRA |
| **Cloud & Lakehouse** | Snowflake, Azure (ADF, Synapse), Databricks |
| **Compute Engine** | Apache Spark, PySpark, Kafka, Airflow |
| **Core Engineering** | Python, SQL, Scala, Docker, Kubernetes |

---

## 🚀 Featured Case Study: Local GenAI Assistant

> **The Problem:** Enterprise environments (GxP/Pharma) restrict sending proprietary code to cloud APIs (GPT-4) due to data leakage risks.
>
> **The Solution:** I engineered a secure, local-first coding assistant capable of running on consumer hardware (8GB VRAM) by fine-tuning SLMs.

### ⚙️ Architecture & Implementation

**1. Data Engineering Pipeline**
* Curated **200,000+ Python code samples** (CodeParrot).
* Built a pre-processing pipeline to deduplicate and tokenize data for high density.

**2. Model Optimization (The "Secret Sauce")**
I utilized **4-bit Quantization (QLoRA)** and **Unsloth** to fit a 3 Billion parameter model onto a single GPU.

```python
# Sample: Loading LLaMA 3.2 with 4-bit Quantization
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.2-3B-Instruct",
    max_seq_length = 2048,
    load_in_4bit = True, # drastically reduces VRAM usage
)
