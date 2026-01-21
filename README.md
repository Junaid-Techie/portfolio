# Junaid Ahmed Mohammed

### Senior Data Engineer | AI Infrastructure Architect
**Indianapolis, IN**

[**LinkedIn**](https://www.linkedin.com/in/junaid-ahmed-mohammed-02321a95/) • [**Email**](mailto:mjunaidtechs@gmail.com) • [**GitHub**](https://github.com/Junaid-Techie)

---

## 👋 About Me

I am a **Senior Data Engineer (5+ YOE)** who builds the heavy-lifting infrastructure that makes AI possible. I specialize in bridging the gap between distributed systems (**Snowflake, Spark**) and modern Generative AI workflows (**Agentic AI, RAG**).

Currently, I focus on the intersection of **Enterprise Data Governance** and **Local LLM Inference**, optimizing billion-parameter models to run efficiently on constrained hardware while ensuring GxP compliance.

---

## 🛠️ Technical Arsenal

| **Domain** | **Stack** |
| :--- | :--- |
| **Generative AI** | LLaMA 3.2, Qwen 2.5, LangChain, Hugging Face, Unsloth, QLoRA |
| **Cloud & Lakehouse** | Snowflake, Azure (ADF, Synapse), Databricks |
| **Streaming & Compute** | Apache Spark, PySpark, Kafka, Airflow |
| **Core Engineering** | Python, SQL, Scala, Docker, Kubernetes |

---

## 🚀 Featured Project: Local GenAI Coding Assistant

> *This project addresses the high cost and privacy risks of cloud-based LLMs by engineering a local-first coding assistant.*

### 1. The Challenge
Enterprise environments (especially Pharma/GxP) often restrict sending proprietary code to external APIs (like GPT-4) due to data leakage risks. Furthermore, cloud inference is expensive and suffers from network latency.

**The Goal:** Engineer a **secure, local coding assistant** capable of running on consumer-grade hardware (limited VRAM) while maintaining high accuracy for Python generation.

### 2. The Solution Architecture
I chose a **Small Language Model (SLM)** approach, fine-tuning **LLaMA 3.2 (3B)** and **Qwen 2.5** to outperform larger models on specific coding tasks.

* **Dataset:** Curated and pre-processed **200,000+ Python code samples** (CodeParrot).
* **Quantization (QLoRA):** Implemented **4-bit quantization** to fit the model into consumer GPU memory (8GB VRAM) without significant precision loss.
* **Optimization (Unsloth):** Utilized the Unsloth library to optimize backpropagation, achieving **2x faster training speeds** and **60% less memory usage**.

### 3. Results & Impact
* **Performance:** Achieved a **40% reduction in perplexity** compared to the base LLaMA 3.2 model for Python syntax.
* **Latency:** Sub-50ms inference time using `llama.cpp` (GGUF format).
* **Security:** 100% on-device generation; zero data egress.

---

## 💼 Professional Experience Highlights

### Snowflake Data Lakehouse Migration
**Nisum Technologies (Williams-Sonoma)**
* **Problem:** Legacy Teradata/Oracle systems were costly and unable to handle real-time scaling.
* **Solution:** Co-architected a migration to **Snowflake**, designing a Star Schema model for **12TB+ of data**.
* **Result:** Reduced infrastructure costs by **25%** and established a "Data-as-a-Product" framework with robust CI/CD governance.

### Real-Time Streaming Pipeline
**Indiana University**
* **Tech:** Apache Kafka, Airflow, Plotly
* **Scope:** Engineered a streaming solution to ingest live transactional data for sales prediction models.
* **Outcome:** Enabled real-time visualization of model performance metrics, reducing data latency from hours to seconds.

---

<small>© 2026 Junaid Ahmed Mohammed. Hosted on GitHub Pages.</small>
