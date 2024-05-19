using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Mpoint : MonoBehaviour
{
    RaycastHit2D raycast;
    private void Start()
    {
        Cursor.visible = false;
    }
    void Update()
    {
        raycast = Physics2D.Raycast(Camera.main.ScreenToWorldPoint(Input.mousePosition), Vector2.zero);
        if (raycast.transform!=null)
        {
            transform.position = raycast.point;
        }
    }
}
