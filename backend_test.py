import requests
import sys
from datetime import datetime
import json

class FishingGameAPITester:
    def __init__(self, base_url="https://apeloff-newsay.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.device_id = f"test_device_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_weather_endpoint(self):
        """Test weather endpoint"""
        return self.run_test("Weather API", "GET", "weather", 200)

    def test_create_user(self):
        """Test user creation"""
        success, response = self.run_test(
            "Create User",
            "POST",
            "user",
            200,
            data={"device_id": self.device_id, "username": "TestAngler"}
        )
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Created user with ID: {self.user_id}")
            return True
        return False

    def test_get_user(self):
        """Test get user by device_id"""
        if not self.device_id:
            print("❌ No device_id available for user lookup")
            return False
        
        return self.run_test(
            "Get User by Device ID",
            "GET",
            f"user/{self.device_id}",
            200
        )[0]

    def test_unlock_lure(self):
        """Test lure unlocking"""
        if not self.user_id:
            print("❌ No user_id available for lure unlock")
            return False
            
        return self.run_test(
            "Unlock Lure",
            "POST",
            f"user/{self.user_id}/unlock-lure",
            200,
            data={"user_id": self.user_id, "lure_id": 1}
        )[0]

    def test_submit_score(self):
        """Test score submission"""
        if not self.user_id:
            print("❌ No user_id available for score submission")
            return False
            
        return self.run_test(
            "Submit Score",
            "POST",
            "score",
            200,
            data={
                "user_id": self.user_id,
                "username": "TestAngler",
                "score": 1500,
                "level": 5,
                "catches": 25,
                "stage": 1
            }
        )[0]

    def test_leaderboard(self):
        """Test leaderboard retrieval"""
        return self.run_test("Get Leaderboard", "GET", "leaderboard?limit=10", 200)[0]

    def test_achievements(self):
        """Test achievements endpoint"""
        return self.run_test("Get Achievements", "GET", "achievements", 200)[0]

    def test_daily_challenge(self):
        """Test daily challenge endpoint"""
        return self.run_test("Get Daily Challenge", "GET", "daily-challenge", 200)[0]

    def test_update_high_score(self):
        """Test high score update"""
        if not self.user_id:
            print("❌ No user_id available for high score update")
            return False
            
        return self.run_test(
            "Update High Score",
            "POST",
            f"user/{self.user_id}/update-high-score?score=2000",
            200
        )[0]

def main():
    print("🎣 GO FISH! API Testing Suite")
    print("=" * 50)
    
    # Setup
    tester = FishingGameAPITester()
    
    # Core API tests
    print("\n📡 Testing Core API Endpoints...")
    tester.test_root_endpoint()
    tester.test_weather_endpoint()
    
    # User management tests
    print("\n👤 Testing User Management...")
    if tester.test_create_user():
        tester.test_get_user()
        tester.test_unlock_lure()
        tester.test_update_high_score()
    
    # Game functionality tests
    print("\n🎮 Testing Game Features...")
    tester.test_submit_score()
    tester.test_leaderboard()
    tester.test_achievements()
    tester.test_daily_challenge()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend API is functioning well!")
        return 0
    elif success_rate >= 50:
        print("⚠️ Backend API has some issues but core functionality works")
        return 1
    else:
        print("❌ Backend API has major issues")
        return 2

if __name__ == "__main__":
    sys.exit(main())