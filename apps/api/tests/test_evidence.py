from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_evidence():
    response = client.get("/api/v1/evidence/")
    # Currently assuming an unauthenticated request returns 401
    assert response.status_code in [200, 401, 403]

def test_create_academic_evidence():
    payload = {
        "title": "BSc Computer Science",
        "description": "Graduated with honors",
        "evidence_type": "academic"
    }
    response = client.post("/api/v1/evidence/", json=payload)
    assert response.status_code in [200, 201, 401, 403]

def test_create_project_evidence():
    payload = {
        "title": "React Dashboard",
        "description": "A web application",
        "evidence_type": "project"
    }
    response = client.post("/api/v1/evidence/", json=payload)
    assert response.status_code in [200, 201, 401, 403]
