# Junaid Ahmed Mohammed

### Senior Data Engineer | AI Infrastructure Architect
**Indianapolis, IN**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/junaid-ahmed-mohammed-02321a95/)
[![GitHub](https://img.shields.io/badge/GitHub-View_Profile-181717?style=for-the-badge&logo=github)](https://github.com/Junaid-Techie)
[![Email](https://img.shields.io/badge/Email-Contact_Me-D14836?style=for-the-badge&logo=gmail)](mailto:mjunaidtechs@gmail.com)

---

## ⚡ Executive Summary

I am a **Senior Data Engineer (5+ YOE)** bridging the gap between distributed systems and modern Generative AI workflows. Unlike traditional data engineers, I don't just move data; I engineer the **intelligent infrastructure** that powers it.

Currently, I am focused on the intersection of **Enterprise Data Governance** and **Local LLM Inference**, optimizing billion-parameter models to run efficiently on constrained hardware.

> **Core Philosophy:** *“Future AI isn't about bigger models; it's about cleaner data pipelines and efficient inference.”*

---

## 🛠️ The Technical Arsenal

### **Generative AI & LLMs**
![LLaMA](https://img.shields.io/badge/Model-LLaMA_3.2-blue?style=flat-square)
![Qwen](https://img.shields.io/badge/Model-Qwen_2.5-blueviolet?style=flat-square)
![HuggingFace](https://img.shields.io/badge/Hub-Hugging_Face-FFD21E?style=flat-square&logo=huggingface&logoColor=black)
![LangChain](https://img.shields.io/badge/Framework-LangChain-1C3C3C?style=flat-square&logo=chainlink&logoColor=white)
![Unsloth](https://img.shields.io/badge/Optimization-Unsloth-000000?style=flat-square)

### **Data Engineering & Lakehouse**
![Snowflake](https://img.shields.io/badge/Lakehouse-Snowflake-29B5E8?style=flat-square&logo=snowflake&logoColor=white)
![Databricks](https://img.shields.io/badge/Compute-Databricks-FF3621?style=flat-square&logo=databricks&logoColor=white)
![Azure](https://img.shields.io/badge/Cloud-Azure_Synapse-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![Kafka](https://img.shields.io/badge/Streaming-Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)

### **Core Stack**
![Python](https://img.shields.io/badge/Code-Python-3776AB?style=flat-square&logo=python&logoColor=white)
![SQL](https://img.shields.io/badge/Query-SQL-4479A1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 🚀 Deep Dive: Local GenAI Assistant
**Role:** AI Engineer & Researcher | **Status:** 🟢 Completed

> **The Problem:** Enterprise environments (GxP/Pharma) restrict sending proprietary code to cloud APIs (GPT-4) due to data leakage risks.
>
> **The Solution:** I engineered a secure, local-first coding assistant capable of running on consumer hardware (8GB VRAM) by fine-tuning SLMs.

### ⚙️ Architecture & Implementation

**1. Data Engineering Pipeline**
* Curated **200,000+ Python code samples** (CodeParrot/StackOverflow).
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
    load_in_4bit = True, # Drastically reduces VRAM usage
)
