import unittest
from backend.tools.travel_search import search_travel, build_bus_booking_url, sanitize_and_verify_bus_url
from backend.agent.intent import extract_cities, extract_transport_type, extract_intent
from backend.agent.orchestrator import orchestrator

class TestBusSearch(unittest.TestCase):
    def test_bus_detection_and_separation(self):
        """User asking for buses must receive only bus results, never trains."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="bus"
        )
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertEqual(r["metadata"]["transport"], "bus")
            self.assertNotEqual(r["metadata"]["transport"], "train")

    def test_train_detection_and_separation(self):
        """User asking for trains must receive only train results, never buses."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="train"
        )
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertEqual(r["metadata"]["transport"], "train")
            self.assertNotEqual(r["metadata"]["transport"], "bus")

    def test_cheapest_bus_ranking(self):
        """Cheapest bus preference sorts results with lowest fare first."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="bus",
            preference="cheapest"
        )
        self.assertGreater(len(results), 1)
        prices = [r["price"] for r in results]
        self.assertEqual(prices, sorted(prices))
        self.assertEqual(results[0]["price"], min(prices))

    def test_fastest_bus_ranking(self):
        """Fastest bus preference sorts results with shortest duration first."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="bus",
            preference="fastest"
        )
        self.assertGreater(len(results), 1)
        durations = [r["metadata"]["duration_minutes"] for r in results]
        self.assertEqual(durations, sorted(durations))
        self.assertEqual(results[0]["metadata"]["duration_minutes"], min(durations))

    def test_inverted_syntax_extraction(self):
        """Fastest bus to Bengaluru from Chennai must extract origin=Chennai, dest=Bengaluru."""
        orig, dest = extract_cities("Fastest bus to Bengaluru from Chennai")
        self.assertEqual(orig, "Chennai")
        self.assertEqual(dest, "Bengaluru")

    def test_between_syntax_extraction(self):
        """Show me buses between Chennai and Bengaluru must extract origin=Chennai, dest=Bengaluru."""
        orig, dest = extract_cities("Show me buses between Chennai and Bengaluru")
        self.assertEqual(orig, "Chennai")
        self.assertEqual(dest, "Bengaluru")

    def test_no_bus_fallback_to_train(self):
        """If no bus data exists (e.g. Delhi to Mumbai), return empty list, do NOT fall back to trains."""
        results = search_travel(
            origin="Delhi",
            destination="Mumbai",
            transport_type="bus"
        )
        self.assertEqual(len(results), 0)

    def test_bus_fields_and_metadata(self):
        """Bus results must contain operator, boarding, dropping, and unique URLs."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="bus"
        )
        self.assertGreater(len(results), 1)
        urls = set()
        for r in results:
            self.assertIsNotNone(r.get("url"))
            self.assertNotEqual(r.get("url"), "")
            self.assertNotEqual(r.get("url"), "https://www.irctc.co.in")
            self.assertNotIn("Demo Travel Data", r.get("source", ""))
            urls.add(r["url"])
            meta = r.get("metadata", {})
            self.assertIn("boarding_point", meta)
            self.assertIn("dropping_point", meta)
            self.assertIn("bus_type", meta)
        # Every result has its own unique URL
        self.assertEqual(len(urls), len(results))

    def test_end_to_end_bus_query(self):
        """Orchestrator processes 'Find buses from Chennai to Bangalore' returning only buses."""
        res = orchestrator.process_message("Find buses from Chennai to Bangalore", "test-bus-session")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["intent"]["transport_type"], "bus")
        self.assertGreater(len(res["results"]), 0)
        for item in res["results"]:
            self.assertEqual(item["metadata"]["transport"], "bus")

    def test_end_to_end_no_buses_query(self):
        """Orchestrator processes 'Find buses from Delhi to Mumbai' with 0 results and polite message."""
        res = orchestrator.process_message("Find buses from Delhi to Mumbai", "test-no-bus-session")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["intent"]["transport_type"], "bus")
        self.assertEqual(len(res["results"]), 0)
        self.assertIn("No buses found", res["message"])

    def test_bus_urls_valid_and_not_dummy(self):
        """All bus results must have real, working booking route URLs without dummy IDs or 404 paths."""
        results = search_travel(
            origin="Chennai",
            destination="Bengaluru",
            transport_type="bus"
        )
        self.assertGreater(len(results), 0)
        for r in results:
            url = r.get("url")
            self.assertIsNotNone(url)
            self.assertTrue(url.startswith("http://") or url.startswith("https://"))
            self.assertNotIn(".do?", url)
            self.assertNotIn("localhost", url)
            self.assertNotIn("example.com", url)
            self.assertNotIn("/serviceDetails", url)
            self.assertNotIn("/tripDetails", url)
            self.assertIn("redbus.in/bus-tickets", url)
            self.assertIn("chennai-to-bangalore", url)

    def test_sanitize_and_verify_bus_url(self):
        """Sanitizer fixes dummy, broken, or legacy .do URLs to authentic route booking pages."""
        # Broken .do URL should be converted to official redBus route search
        broken_url = "https://www.tnstc.in/serviceDetails.do?serviceNumber=SETC-GEN"
        fixed = sanitize_and_verify_bus_url(broken_url, "Chennai", "Bengaluru", "SETC", "Ultra Deluxe")
        self.assertIn("https://www.redbus.in/bus-tickets/chennai-to-bangalore", fixed)
        self.assertIn("operator=SETC", fixed)

        # None or '#' or localhost should also be fixed
        fixed_none = sanitize_and_verify_bus_url(None, "Hyderabad", "Vijayawada", "TSRTC")
        self.assertIn("https://www.redbus.in/bus-tickets/hyderabad-to-vijayawada", fixed_none)
        self.assertIn("operator=TSRTC", fixed_none)

        # Valid custom URL should be kept intact
        valid_url = "https://www.redbus.in/bus-tickets/chennai-to-madurai"
        self.assertEqual(sanitize_and_verify_bus_url(valid_url, "Chennai", "Madurai"), valid_url)

    def test_bus_booking_url_prefills_date_without_undefined(self):
        """Bus booking URL must prefill doj parameter when travel_date is provided and have no undefined values."""
        # Test tomorrow
        url_tomorrow = build_bus_booking_url("Chennai", "Bengaluru", "KSRTC", "Airavat", "tomorrow")
        self.assertIn("https://www.redbus.in/bus-tickets/chennai-to-bangalore", url_tomorrow)
        self.assertIn("doj=", url_tomorrow)
        self.assertIn("operator=KSRTC", url_tomorrow)
        self.assertNotIn("undefined", url_tomorrow)
        self.assertNotIn("null", url_tomorrow)

        # Test specific date
        url_iso = build_bus_booking_url("Delhi", "Jaipur", "RSRTC", "Volvo", "2026-10-15")
        self.assertIn("doj=15-Oct-2026", url_iso)
        self.assertNotIn("undefined", url_iso)

        # Test sanitize_and_verify_bus_url prefilling date
        broken_url = "https://www.tnstc.in/serviceDetails.do?serviceNumber=SETC-GEN"
        sanitized = sanitize_and_verify_bus_url(broken_url, "Chennai", "Bengaluru", "SETC", "Ultra Deluxe", "tomorrow")
        self.assertIn("doj=", sanitized)
        self.assertNotIn("undefined", sanitized)
        self.assertNotIn(".do?", sanitized)

