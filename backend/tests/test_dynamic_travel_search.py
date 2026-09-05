import unittest
from backend.agent.orchestrator import CentralOrchestrator
from backend.tools.travel_search import search_travel, normalize_city

class TestDynamicTravelSearch(unittest.TestCase):
    def setUp(self):
        self.orchestrator = CentralOrchestrator()

    def test_chennai_to_hyderabad_train_search(self):
        """User request: 'Train from Chennai to Hyderabad' must return real train results."""
        sid = "dyn-test-hyd-train"
        res = self.orchestrator.process_message("Train from Chennai to Hyderabad", session_id=sid)

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["result_type"], "travel")
        self.assertGreater(len(res["results"]), 0)

        # Every single result must be a train
        for item in res["results"]:
            self.assertEqual(item["type"], "travel")
            self.assertEqual(item["metadata"]["transport"], "train")
            self.assertIn("irctc", item["source"].lower())
            self.assertTrue(item["url"].startswith("https://www.irctc.co.in"))
            self.assertEqual(item["metadata"]["origin"].lower(), "chennai")
            self.assertEqual(item["metadata"]["destination"].lower(), "hyderabad")

    def test_chennai_to_hyderabad_bus_search(self):
        """User request: 'Bus from Chennai to Hyderabad' must return bus results only."""
        sid = "dyn-test-hyd-bus"
        res = self.orchestrator.process_message("Bus from Chennai to Hyderabad", session_id=sid)

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["result_type"], "travel")
        self.assertGreater(len(res["results"]), 0)

        for item in res["results"]:
            self.assertEqual(item["metadata"]["transport"], "bus")
            self.assertIsNotNone(item["metadata"]["operator"])
            self.assertIsNotNone(item["metadata"]["boarding_point"])
            self.assertIsNotNone(item["metadata"]["dropping_point"])

    def test_mumbai_to_pune_train_and_bus(self):
        """Mumbai to Pune routes must return respective modes without cross-contamination."""
        train_res = self.orchestrator.process_message("Train from Mumbai to Pune", session_id="mum-pun-tr")
        self.assertGreater(len(train_res["results"]), 0)
        for item in train_res["results"]:
            self.assertEqual(item["metadata"]["transport"], "train")

        bus_res = self.orchestrator.process_message("Bus from Mumbai to Pune", session_id="mum-pun-bus")
        self.assertGreater(len(bus_res["results"]), 0)
        for item in bus_res["results"]:
            self.assertEqual(item["metadata"]["transport"], "bus")

    def test_arbitrary_unlisted_city_pairs_dynamic_search(self):
        """Dynamic travel engine must produce authentic routes for arbitrary valid city pairs."""
        # Kolkata to Patna
        kol_pat = search_travel(origin="Kolkata", destination="Patna", transport_type="train")
        self.assertGreater(len(kol_pat), 0)
        self.assertEqual(kol_pat[0]["metadata"]["transport"], "train")
        self.assertTrue(kol_pat[0]["url"].startswith("https://www.irctc.co.in"))

        # Bangalore to Mysore bus
        blr_mys = search_travel(origin="Bengaluru", destination="Mysuru", transport_type="bus")
        self.assertGreater(len(blr_mys), 0)
        self.assertEqual(blr_mys[0]["metadata"]["transport"], "bus")

        # Hyderabad to Visakhapatnam train
        hyd_viz = search_travel(origin="Hyderabad", destination="Visakhapatnam", transport_type="train")
        self.assertGreater(len(hyd_viz), 0)
        self.assertEqual(hyd_viz[0]["metadata"]["transport"], "train")

    def test_city_normalization_and_aliases(self):
        """Ensure city aliases like Bangalore/Bengaluru and Secunderabad/Hyderabad resolve consistently."""
        self.assertEqual(normalize_city("Bangalore"), "bengaluru")
        self.assertEqual(normalize_city("Bengaluru"), "bengaluru")
        self.assertEqual(normalize_city("Secunderabad"), "hyderabad")
        self.assertEqual(normalize_city("Vizag"), "visakhapatnam")
        self.assertEqual(normalize_city("Bombay"), "mumbai")
        self.assertEqual(normalize_city("Madras"), "chennai")

        # Searching Bangalore to Hyderabad should return results equivalent to Bengaluru to Hyderabad
        res1 = search_travel(origin="Bangalore", destination="Hyderabad", transport_type="train")
        res2 = search_travel(origin="Bengaluru", destination="Hyderabad", transport_type="train")
        self.assertGreater(len(res1), 0)
        self.assertEqual(len(res1), len(res2))

    def test_cheapest_and_fastest_ranking_on_dynamic_routes(self):
        """Ranking system works accurately on dynamically generated routes."""
        cheapest = search_travel(origin="Kolkata", destination="Patna", transport_type="train", preference="cheapest")
        fastest = search_travel(origin="Kolkata", destination="Patna", transport_type="train", preference="fastest")

        self.assertGreater(len(cheapest), 1)
        self.assertGreater(len(fastest), 1)
        # Lowest price first
        self.assertLessEqual(cheapest[0]["price"], cheapest[-1]["price"])
        # Shortest duration first
        self.assertLessEqual(fastest[0]["metadata"]["duration_minutes"], fastest[-1]["metadata"]["duration_minutes"])

if __name__ == "__main__":
    unittest.main()
