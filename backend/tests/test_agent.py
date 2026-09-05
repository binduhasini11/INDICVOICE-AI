import unittest
from unittest.mock import patch
import uuid
from backend.agent.orchestrator import CentralOrchestrator

class TestAgentOrchestrator(unittest.TestCase):
    def setUp(self):
        self.orchestrator = CentralOrchestrator()

    def test_missing_travel_destination_needs_clarification(self):
        sid = str(uuid.uuid4())
        resp = self.orchestrator.process_message("Chennai la irundhu train venum", session_id=sid)
        self.assertEqual(resp["status"], "needs_clarification")
        self.assertTrue(resp["needs_clarification"])
        self.assertEqual(len(resp["results"]), 0)
        self.assertIn("Where", resp["message"])

    def test_multi_turn_context_merging(self):
        sid = str(uuid.uuid4())
        # Turn 1: Partial travel
        resp1 = self.orchestrator.process_message("Chennai to Bangalore train venum", session_id=sid)
        # Turn 2: Follow-up slot filling
        resp2 = self.orchestrator.process_message("naalaiku morning", session_id=sid)

        self.assertEqual(resp2["status"], "success")
        self.assertFalse(resp2["needs_clarification"])
        intent = resp2["intent"]
        self.assertEqual(intent["intent"], "travel_search")
        self.assertEqual(intent["origin"].lower(), "chennai")
        self.assertIn(intent["destination"].lower(), ["bangalore", "bengaluru"])
        self.assertEqual(intent["date"], "tomorrow")
        self.assertEqual(intent["time"], "morning")
        self.assertTrue(len(resp2["results"]) > 0)

    def test_topic_switch_clears_previous_travel_context(self):
        sid = str(uuid.uuid4())
        # Turn 1: Travel
        self.orchestrator.process_message("Chennai to Bangalore tomorrow train", session_id=sid)
        # Turn 2: Clear switch to Product
        resp2 = self.orchestrator.process_message("show me headphones under 5000", session_id=sid)
        intent = resp2["intent"]
        self.assertEqual(intent["intent"], "product_search")
        # Ensure travel fields are not leaking into product
        self.assertNotIn("origin", intent)
        self.assertEqual(resp2["result_type"], "product")

    def test_empty_search_results_friendly_response(self):
        sid = str(uuid.uuid4())
        # Unmatched travel route
        resp = self.orchestrator.process_message("Jaipur to Kochi train", session_id=sid)
        self.assertEqual(resp["status"], "success")
        self.assertEqual(len(resp["results"]), 0)
        self.assertIn("couldn't find", resp["message"].lower())

    @patch("backend.services.search_service.SearchService.execute_travel")
    def test_specialist_failure_controlled_error(self, mock_travel):
        sid = str(uuid.uuid4())
        mock_travel.side_effect = RuntimeError("Downstream IRCTC API timed out")

        resp = self.orchestrator.process_message("Chennai to Bangalore train", session_id=sid)
        self.assertEqual(resp["status"], "error")
        self.assertEqual(resp["error_code"], "SPECIALIST_EXECUTION_ERROR")
        self.assertIn("encountered an issue", resp["message"])
        self.assertEqual(resp["results"], [])
        # Assert no stack trace or raw exception leaked to client
        self.assertNotIn("Traceback", resp["message"])
        self.assertNotIn("RuntimeError", resp["message"])

if __name__ == "__main__":
    unittest.main()
