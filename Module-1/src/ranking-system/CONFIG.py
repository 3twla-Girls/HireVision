import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG = {
    "embed_model": "mixedbread-ai/mxbai-embed-large-v1",
    "cross_encoder_model": "cross-encoder/ms-marco-MiniLM-L-6-v2",
    "chunk_size_tokens": 100,
    "chunk_overlap_tokens": 20,
    "top_k_retriever": 40,
    "top_k_rerank": 15,
    # "cache_dir": "./embedding_cache",
    "cache_dir": os.path.join(BASE_DIR, "embedding_cache"),
    "semantic_threshold": 0.6,
    "fuzzy_threshold": 60,
    "max_cv_chunks": 100,
    "min_chunk_length": 10,

    # FIX: Remove context from fusion (not used)
    "fusion_weights": {
        "dense": 0.50,    # Semantic similarity
        "sparse": 0.25,   # Keyword matching
        "skill": 0.25     # Skill overlap
    },

    "skill_signal_weights": {
        "exact": 0.35,
        "fuzzy": 0.25,
        "semantic": 0.30,
        "context": 0.10
    },

    # FIX: Give more weight to skills (they're most important!)
    "final_weights": {
        "skill": 0.40,        # Most important
        "rerank": 0.35,       # Semantic relevance
        "retrieval": 0.25     # Initial retrieval
    },


    "skill_importance":  {
        "high": [
        "Python", "Java", "C#", "JavaScript", "TypeScript", "Go", "C++",
        "React", "Angular", "Vue.js", "Node.js", "ASP.NET Core", "Spring Boot", "Express.js",
        "Django", "Flask", "FastAPI",
        "SQL", "PostgreSQL", "MySQL", "SQL Server", "Oracle Database",
        "REST API", "GraphQL",
        "Git", "GitHub", "GitLab",
        "Linux",
        "Docker", "Kubernetes",
        "AWS", "Azure", "Google Cloud Platform",
        "Microservices",
        "Data Structures", "Algorithms", "OOP", "System Design",
        "HTML", "CSS"
        ],

        "medium": [
        "MongoDB", "Redis", "SQLite", "Elasticsearch",
        "Kafka", "RabbitMQ", "gRPC",
        "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
        "Terraform", "Ansible",
        "Nginx",
        "Prometheus", "Grafana",
        "ORM", "Entity Framework", "Hibernate", "Sequelize", "Prisma",
        "Unit Testing", "Integration Testing", "Jest", "Mocha", "JUnit", "PyTest",
        "Cypress", "Playwright", "Selenium",
        "JWT", "OAuth2",
        "WebSockets",
        "Event-Driven Architecture",
        "Performance Optimization",
        "Load Balancing",
        "API Gateway",
        "Message Queues"
        ],

        "low": [
        "Agile", "Scrum", "Kanban",
        "Jira", "Confluence",
        "Communication", "Teamwork", "Problem Solving", "Time Management",
        "Figma", "UX Basics", "UI Basics",
        "Excel", "Google Sheets",
        "Presentation Skills", "Leadership",
        "Manual Testing",
        "Documentation"
        ]
    },
    "context_map" : {
            # Languages
            "c#": ["oop", "linq", "csharp syntax"],
            ".net": ["c#", "asp.net", "entity framework", "nuget", "visual studio"],
            "java": ["oop", "jvm", "maven", "gradle", "spring", "spring boot", "hibernate"],
            "python": ["pip", "venv", "pandas", "numpy", "matplotlib", "scikit-learn", "django basics", "flask basics"],
            "javascript": ["es6", "dom", "npm", "json", "event loop"],
            "typescript": ["javascript", "es6", "interfaces", "types", "npm"],

            # Frontend
            "react": ["javascript", "jsx", "hooks", "components", "react router", "state management"],
            "angular": ["typescript", "rxjs", "components", "angular cli"],
            "vue": ["javascript", "components", "vuex", "router"],

            # Backend - Node Family
            "node.js": ["javascript", "npm", "express", "backend basics", "json"],
            "express": ["node.js", "routing", "middleware", "rest api"],
            "nest.js": ["typescript", "node.js", "modules", "decorators"],

            # Databases
            "sql": ["joins", "tables", "queries", "database basics"],
            "sql server": ["database","t-sql", "mssql", "ssms"],
            "mysql": ["database","sql", "mariadb", "queries"],
            "postgresql": ["database","sql", "schemas", "psql"],
            "mongodb": ["database", "nosql", "mongoose", "document databases"],

            # Cloud Platforms
            "aws": ["s3", "ec2", "iam", "lambda basics", "rds"],
            "azure": ["devops", "app service", "functions basics"],
            "gcp": ["compute engine", "bigquery basics", "cloud storage"],

            # DevOps / Infrastructure
            "docker": ["containers", "dockerfile", "images", "volumes", "compose"],
            "kubernetes": ["k8s", "pods", "deployments", "services", "helm"],
            "ci/cd": ["pipelines", "automation", "github actions", "gitlab ci"],

            # Version Control
            "git": ["github", "branches", "commits", "pull requests"],

            # Methodologies
            "agile": ["scrum", "kanban", "sprints", "jira basics"],

            # APIs
            "rest api": ["http", "endpoints", "json", "status codes"],
            "graphql": ["queries", "mutations", "schemas", "apollo basics"],

            # AI / Data
            "machine learning": ["AI", "ML", "scikit-learn", "model training", "evaluation", "Data Preprocessing"],
            "ML": ["AI", "machine learning", "scikit-learn", "model training", "evaluation", "Data Preprocessing"],
            "deep learning": ["AI", "neural networks", "tensorflow", "pytorch"],
            "data analysis": ["pandas", "numpy", "visualization"],
        }
}
if not os.path.exists(CONFIG["cache_dir"]):
    os.makedirs(CONFIG["cache_dir"], exist_ok=True)