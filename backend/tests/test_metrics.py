"""Metrics, scoped by project (with subproject roll-up)."""
import uuid


def metrics(user, *projects):
    r = user.get("/metrics", params=[("project", p) for p in projects])
    assert r.status_code == 200, r.text
    return r.json()


def test_scoping_by_project_and_no_project(user):
    work = user.project("Work", "WORK")
    user.goal("w1", project_id=work["id"], score=5, column="Done")
    user.goal("w2", project_id=work["id"], score=3)
    user.goal("loose", score=1)

    assert metrics(user)["total_goals"] == 3
    m = metrics(user, work["id"])
    assert (m["total_goals"], m["completed_goals"], m["efficiency"]) == (2, 1, 0.625)
    assert m["best_month"]["completed"] == 1
    assert metrics(user, "none")["total_goals"] == 1
    assert metrics(user, work["id"], "none")["total_goals"] == 3


def test_parent_rolls_up_subprojects_without_double_counting(user):
    pp = user.project("PP", "PP")
    ios = user.project("iOS", "IOS", parent_id=pp["id"])
    onb = user.project("Onb", "ONB", parent_id=ios["id"])
    user.goal(project_id=pp["id"])
    user.goal(project_id=ios["id"], score=4, column="Done")
    user.goal(project_id=onb["id"], score=2)

    assert metrics(user, pp["id"])["total_goals"] == 3
    m = metrics(user, ios["id"])
    assert (m["total_goals"], m["completed_goals"], m["efficiency"]) == (2, 1, round(4 / 6, 4))
    assert metrics(user, onb["id"])["total_goals"] == 1
    assert metrics(user, pp["id"], ios["id"])["total_goals"] == 3


def test_bad_scopes(user):
    assert user.get("/metrics", params={"project": str(uuid.uuid4())}).status_code == 404
    assert user.get("/metrics", params={"project": "nope"}).status_code == 422
