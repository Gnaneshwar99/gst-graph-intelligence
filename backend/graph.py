from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class GraphDB:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI"),
            auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
        )

    def run_query(self, query, parameters=None):
        with self.driver.session() as session:
            result = session.run(query, parameters)
            return [r.data() for r in result]

    def close(self):
        self.driver.close()

db = GraphDB()