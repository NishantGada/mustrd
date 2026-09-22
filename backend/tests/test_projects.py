"""Projects: validation, re-keying, deletion, and subprojects."""
import uuid


def test_create_normalizes_key_and_color(user):
    p = user.project("Work", "work", color="#3B82F6")
    assert p["key"] == "WORK" and p["color"] == "#3b82f6" and p["parent_id"] is None


def test_key_and_color_validation(user):
    user.project("Work", "WORK")
    post = lambda key, color="#000000": user.post(
        "/projects", json={"name": "X", "key": key, "color": color}
    ).status_code
    assert post("WORK") == 409  # taken
    assert post("TBD") == 422  # reserved
    assert post("1AB") == 422  # must start with a letter
    assert post("A") == 422  # too short
    assert post("OK", color="blue") == 422


def test_renaming_prefix_rekeys_every_goal_including_done(user):
    work = user.project("Work", "WORK")
    user.goal("a", project_id=work["id"])
    user.goal("b", project_id=work["id"], column="Done")
    r = user.patch(f"/projects/{work['id']}", json={"key": "job"})
    assert r.json()["key"] == "JOB"
    assert sorted(g["key"] for g in user.goals().values()) == ["JOB-1", "JOB-2"]


def test_renaming_to_taken_prefix_conflicts(user):
    work = user.project("Work", "WORK")
    user.project("Home", "HOME")
    assert user.patch(f"/projects/{work['id']}", json={"key": "HOME"}).status_code == 409


def test_description_can_be_cleared(user):
    p = user.project("Work", "WORK", description="job stuff")
    assert user.patch(f"/projects/{p['id']}", json={"description": None}).json()["description"] is None


def test_deleting_top_level_project_moves_goals_to_tbd(user):
    work = user.project("Work", "WORK")
    user.goal("pre-existing")  # TBD-1
    user.goal("a", project_id=work["id"])
    user.goal("b", project_id=work["id"])
    assert user.delete(f"/projects/{work['id']}").status_code == 204
    goals = user.goals()
    assert len(goals) == 3
    assert sorted([goals["a"]["key"], goals["b"]["key"]]) == ["TBD-2", "TBD-3"]
    assert user.get(f"/projects/{work['id']}").status_code == 404


# --- Subprojects ---
def test_subprojects_nest_and_keep_their_own_keys(user):
    pp = user.project("Personal Projects", "PP")
    ios = user.project("Build an iOS App", "IOS", parent_id=pp["id"])
    onb = user.project("Onboarding", "ONB", parent_id=ios["id"])
    assert onb["parent_id"] == ios["id"]
    assert user.goal(project_id=ios["id"])["key"] == "IOS-1"
    assert user.goal(project_id=onb["id"])["key"] == "ONB-1"


def test_unknown_parent_is_rejected(user):
    r = user.post(
        "/projects", json={"name": "X", "key": "XX", "color": "#000000", "parent_id": str(uuid.uuid4())}
    )
    assert r.status_code == 404


def test_cycles_are_rejected(user):
    pp = user.project("PP", "PP")
    ios = user.project("iOS", "IOS", parent_id=pp["id"])
    onb = user.project("Onb", "ONB", parent_id=ios["id"])
    for parent in (ios, onb):
        assert user.patch(f"/projects/{pp['id']}", json={"parent_id": parent["id"]}).status_code == 400
    assert user.patch(f"/projects/{ios['id']}", json={"parent_id": ios["id"]}).status_code == 400


def test_reparent_and_make_top_level(user):
    pp = user.project("PP", "PP")
    web = user.project("Web", "WEB", parent_id=pp["id"])
    onb = user.project("Onb", "ONB", parent_id=pp["id"])
    assert user.patch(f"/projects/{onb['id']}", json={"parent_id": web["id"]}).json()["parent_id"] == web["id"]
    r = user.patch(f"/projects/{onb['id']}", json={"parent_id": None})
    assert r.json()["parent_id"] is None and r.json()["key"] == "ONB"


def test_patch_without_parent_id_keeps_parent(user):
    pp = user.project("PP", "PP")
    ios = user.project("iOS", "IOS", parent_id=pp["id"])
    assert user.patch(f"/projects/{ios['id']}", json={"name": "iOS App"}).json()["parent_id"] == pp["id"]


def test_deleting_mid_level_project(user):
    pp = user.project("PP", "PP")
    ios = user.project("iOS", "IOS", parent_id=pp["id"])
    onb = user.project("Onb", "ONB", parent_id=ios["id"])
    user.goal("pp goal", project_id=pp["id"])
    user.goal("ios goal", project_id=ios["id"], column="Done")
    user.goal("onb goal", project_id=onb["id"])

    assert user.delete(f"/projects/{ios['id']}").status_code == 204
    projects = {p["key"]: p for p in user.get("/projects").json()}
    assert "IOS" not in projects
    assert projects["ONB"]["parent_id"] == pp["id"]  # subproject moved up a level
    goals = user.goals()
    assert goals["ios goal"]["key"] == "PP-2" and goals["ios goal"]["project_id"] == pp["id"]
    assert goals["ios goal"]["completed_at"] is not None
    assert goals["onb goal"]["key"] == "ONB-1"
    assert len(goals) == 3


def test_deleting_top_level_parent_makes_children_top_level(user):
    pp = user.project("PP", "PP")
    user.project("Web", "WEB", parent_id=pp["id"])
    user.delete(f"/projects/{pp['id']}")
    assert all(p["parent_id"] is None for p in user.get("/projects").json())
