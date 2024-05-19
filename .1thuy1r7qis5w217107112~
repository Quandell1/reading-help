using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class StartButton : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    public Animator mpAnima;
    private bool isTouch;
    void Start()
    {
        GetComponent<Button>().onClick.AddListener(() => { mpAnima.SetBool("down", true); });
    }
    private void Update()
    {
        mpAnima.SetBool("touch", isTouch);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        isTouch = true;
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        isTouch = false;
    }
}
