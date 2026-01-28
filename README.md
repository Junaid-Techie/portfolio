# JUNAID AHMED MOHAMMED
[LinkedIn](https://www.linkedin.com/in/junaid-ahmed-mohammed-02321a95/) | [Email](mailto:mjunaidtechs@gmail.com)

Senior Data Engineer with **5+ years of experience** bridging the gap between distributed systems (Snowflake, Spark) and modern Generative AI. I specialize in optimizing ETL pipelines, architecting Enterprise Data Lakehouses, and engineering Local Code Generation Models.

## EDUCATION
- **Indiana University Indianapolis**, Luddy School of Informatics, Computing, and Engineering
  - Master of Science in **Applied Data Science**
  - Graduation: Dec 2025
  - *Relevant Coursework:* Applied AI, Machine Learning, Big Data Frameworks, Cloud Computing.

- **Muffakham Jah College of Engineering and Technology**, Hyderabad, India
  - Bachelor of Engineering in Civil Engineering
  - Graduation: 2018

## PROFESSIONAL EXPERIENCE

### Graduate Research Assistant & Teaching Assistant | [Indiana University](https://indianapolis.iu.edu/) | Jan 2024 - Dec 2025
- **GenAI Research & Engineering:** Developed local Python code generation models by fine-tuning **LLaMA 3.2 (3B)** and **Qwen 2.5**. Implemented continual pretraining on the CodeParrot dataset utilizing **QLoRA** and **Unsloth** for resource-constrained environments.
- **Real-Time Pipelines:** Designed streaming solutions using **Kafka** and **Apache Airflow** to ingest live transactional data for sales prediction models.
- **Mentorship:** Mentored 60+ graduate students in Data Analytics, conducting rigorous code reviews in Python and SQL.

### Senior Data Engineer | [Nisum Technologies](https://www.nisum.com/) (Client: Williams-Sonoma) | Nov 2018 - Dec 2023
- **Lakehouse Architecture:** Co-architected a scalable Snowflake Data Lakehouse utilizing star schema, migrating **12TB+** of legacy data from Teradata/Oracle to Azure, reducing infrastructure costs by **25%**.
- **Pipeline Orchestration:** Owned 50+ Azure Data Factory pipelines with automated triggers, ingesting data into Snowflake and ADLS.
- **Performance Tuning:** Optimized long-running PySpark jobs using **Z-Ordering**, Partitioning, and Broadcast variables, reducing execution time by **40%**.
- **System Reliability:** Constructed robust alerting via Webhooks to trigger notifications on source failures, reducing manual monitoring overhead.

## PROJECTS

### [Python Code Generator – Local LLM Fine-Tuning](https://github.com/Junaid-Techie/PythonCodeGen-Repo) | Spring 2024
*Engineered Python code generation models using lightweight LLMs capable of running locally on consumer hardware.*
- **Model Optimization:** Applied **4-bit quantization** and Parameter-Efficient Fine-Tuning (**PEFT**) with **LoRA** to optimize billion-parameter models (LLaMA 3.2, Qwen 2.5, Gemma 3) for efficient single-GPU training.
- **Continual Pretraining:** Implemented continual pretraining of GPT-2 on 200,000 Python code samples from the **CodeParrot** dataset, achieving optimal loss minima.
- **Statistical Evaluation:** Designed rigorous experiments proving that architecture design and pretraining quality significantly impact performance, sometimes outweighing raw parameter count.
- **Infrastructure:** Implemented the **Unsloth** framework with custom modifications for highly efficient fine-tuning, leveraging gradient accumulation to handle 1024-token sequences on limited VRAM (10GB).
- **Research Impact:** Identified statistical limitations in traditional metrics like perplexity and CodeBLEU, developing alternative evaluation methodologies for code generation tasks.

### Real-Time Sales Prediction Pipeline | *Coming Soon*
- Engineered a streaming data pipeline using **Apache Kafka** to capture live sales events.
- Orchestrated data processing via **Apache Airflow** and visualized real-time model performance using **Dash** and **Plotly**.

### HR Recruitment Application – Full Stack Tool | *Internal Project*
- Developed a custom internal application using **Python (Falcon)**, **MongoDB**, and **REST APIs**.
- Automated the recruitment tracking process, reducing manual data entry redundancy by **40%**.

### Demand Forecasting Model | *Data Science Case Study*
- Built a demand forecasting model using **Time Series Analysis** (Holt-Winters/ARIMA).
- Predicted sales across major fabric product categories, enabling a **20% improvement** in inventory planning accuracy.

## TECHNICAL SKILLS
- **Generative AI:** LLaMA 3.2, Qwen 2.5, Gemma 3, Unsloth, Hugging Face Transformers, PEFT/LoRA, Quantization.
- **Cloud & Big Data:** Azure (ADF, Databricks, Synapse), Snowflake, Apache Spark, PySpark, Kafka, Airflow.
- **Languages:** Python, SQL, Scala, Java.
- **Tools:** Git, Jira, Confluence, Plotly, Dash, Power BI.

## CERTIFICATIONS
- [**GenAI 101 Certified**](https://badges.parchment.com/public/assertions/bWV_8KpZQaKuGawrEl4KHQ/) | Indiana University
