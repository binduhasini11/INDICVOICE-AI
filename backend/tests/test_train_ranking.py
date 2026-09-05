import unittest
from backend.tools.travel_search import search_travel
from backend.services.ranking import rank_travel_results, calculate_duration_minutes, parse_time_to_minutes
from backend.agent.orchestrator import orchestrator

class TestTrainRanking(unittest.TestCase):
    def test_cheapest_preference_sorts_by_lowest_fare(self):
        """When user explicitly asks for cheapest or lowest price, lowest fare must come first."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            preference="cheapest",
            transport_type="train"
        )
        self.assertGreater(len(results), 1)
        prices = [r["price"] for r in results]
        # Prices must be strictly in non-decreasing order
        self.assertEqual(prices, sorted(prices))
        # The first item must have the lowest price
        self.assertEqual(results[0]["price"], min(prices))

    def test_fastest_preference_sorts_by_shortest_duration(self):
        """When user explicitly asks for fastest, shortest duration must come first."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            preference="fastest",
            transport_type="train"
        )
        self.assertGreater(len(results), 1)
        durations = [r["metadata"]["duration_minutes"] for r in results]
        # Durations must be in non-decreasing order
        self.assertEqual(durations, sorted(durations))
        # First item must have the shortest duration
        self.assertEqual(results[0]["metadata"]["duration_minutes"], min(durations))

    def test_balanced_ranking_without_explicit_preference(self):
        """When preference is not specified, balanced ranking considers fare, duration, and departure."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            preference=None,
            transport_type="train"
        )
        self.assertGreater(len(results), 1)
        # Verify metadata duration is populated on all items
        for r in results:
            self.assertIn("duration_minutes", r["metadata"])
            self.assertIn("duration", r["metadata"])
            self.assertGreater(r["metadata"]["duration_minutes"], 0)

    def test_departure_time_proximity(self):
        """Prefers trains closer to user requested departure time."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="train",
            requested_departure_time="07:00"
        )
        self.assertGreater(len(results), 1)
        top_departure = results[0]["metadata"]["departure"]
        top_dep_min = parse_time_to_minutes(top_departure)
        target_min = parse_time_to_minutes("07:00")
        diff_top = abs(top_dep_min - target_min)
        # Ensure the top result departure is reasonably close to 07:00
        self.assertLessEqual(diff_top, 60)

    def test_arrival_time_proximity(self):
        """Considers user requested arrival time when provided."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="train",
            requested_arrival_time="10:30"
        )
        self.assertGreater(len(results), 1)
        top_arrival = results[0]["metadata"]["arrival"]
        # The train arriving at 10:30 should be ranked first
        self.assertEqual(top_arrival, "10:30")

    def test_orchestrator_end_to_end_ranking(self):
        """End-to-end test via chat message asking for fastest train."""
        resp = orchestrator.process_message(
            "Chennai la irundhu Bangalore ku fastest train paathu sollu",
            session_id="test-train-ranking"
        )
        self.assertEqual(resp["status"], "success")
        self.assertEqual(resp["result_type"], "travel")
        results = resp["results"]
        self.assertGreater(len(results), 0)
        # Check first result is fastest
        durations = [r["metadata"]["duration_minutes"] for r in results]
        self.assertEqual(durations[0], min(durations))

if __name__ == "__main__":
    unittest.main()
