using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class SCamera : MonoBehaviour
{
    public RawImage rawImage1;

    private Camera theCamera;
    void Start()
    {
        theCamera = GetComponent<Camera>();
        StartCoroutine(Show(rawImage1.rectTransform.rect));
    }
    //void OnPostRender()
    //{
    //    Texture2D screenShot = new Texture2D((int)rawImage1.rectTransform.rect.width, (int)rawImage1.rectTransform.rect.height, TextureFormat.RGB24, false);
    //    screenShot.ReadPixels(new Rect(0, 0, Screen.width, Screen.height), 0, 0);
    //    screenShot.Apply();
    //    rawImage1.texture = screenShot;
    //}
    IEnumerator Show(Rect rect)
    {
        RenderTexture rt = new RenderTexture((int)rect.width, (int)rect.height, 0);
        theCamera.targetTexture = rt;
        Texture2D screenShot = new Texture2D((int)rect.width, (int)rect.height, TextureFormat.RGB24, false);
        while (true)
        {
            yield return new WaitForEndOfFrame();
            //theCamera.Render();
            RenderTexture.active = rt;
            screenShot.ReadPixels(new Rect(0,0, Screen.width, Screen.height), 0, 0);
            screenShot.Apply();

            rawImage1.texture = screenShot;
            
            //theCamera.targetTexture = null;
            RenderTexture.active = null;
        }
    }
}
