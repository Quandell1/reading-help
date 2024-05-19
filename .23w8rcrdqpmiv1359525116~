using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class camCollider : MonoBehaviour
{
    public List<GameObject> something = new List<GameObject>();
    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.transform.tag != "Canvas")
        {
            something.Add(collision.gameObject);
        }
    }
    private void OnTriggerExit2D(Collider2D collision)
    {
        something.Remove(collision.gameObject);
    }
}
