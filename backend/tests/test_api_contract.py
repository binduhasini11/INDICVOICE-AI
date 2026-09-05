import unittest
import uuid
from backend.agent.orchestrator import orchestrator

class TestApiContract(unittest.TestCase):
    def test_schema_compliance_success(self):
        sid = str(uuid.uuid4())
        resp = orchestrator.process_message("Chennai to Bangalore train tomorrow morning", session_id=sid)

        # Check required schema fields
        self.assertIn("status", resp)
        self.assertIn("message", resp)
        self.assertIn("intent", resp)
        self.assertIn("results", resp)
        self.assertIn("result_type", resp)
        self.assertIn("session_id", resp)
        self.assertIn("needs_clarification", resp)

        self.assertIsInstance(resp["status"], str)
        self.assertIsInstance(resp["message"], str)
        self.assertIsInstance(resp["intent"], dict)
        self.assertIsInstance(resp["results"], list)
        self.assertIsInstance(resp["session_id"], str)
        self.assertIsInstance(resp["needs_clarification"], bool)

        if resp["results"]:
            first = resp["results"][0]
            self.assertIn("type", first)
            self.assertIn("title", first)
            self.assertIn("price", first)
            self.assertIn("currency", first)
            self.assertIn("source", first)

    def test_schema_compliance_clarification(self):
        sid = str(uuid.uuid4())
        resp = orchestrator.process_message("Bangalore ku train venum", session_id=sid)
        self.assertEqual(resp["status"], "needs_clarification")
        self.assertTrue(resp["needs_clarification"])
        self.assertIsNone(resp["result_type"])
        self.assertEqual(resp["results"], [])

if __name__ == "__main__":
    unittest.main()
