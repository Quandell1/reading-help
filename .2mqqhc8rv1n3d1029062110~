using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DG.Tweening;

public class CamTest : MonoBehaviour
{
    public RawImage rawImage;
    public RawImage TVRawImage;
    public Camera myCamera;
    public Camera mainCamera;
    public GameObject camCollider;
    public GameObject cam;
    public Image newsImage;
    public Text newsText;

    private bool isShot;
    public RenderTexture rt;
    RaycastHit2D raycast;
    Texture2D texture;
    float mainCamOrthographicSize;
    Vector3 mainCamPoint;
    //int newType = -1;
    private void Start()
    {
        mainCamOrthographicSize = mainCamera.orthographicSize;
        mainCamPoint = mainCamera.transform.position;
    }
    void Update()
    {
        if (!isShot)
        {
            raycast = Physics2D.Raycast(Camera.main.ScreenToWorldPoint(Input.mousePosition), Vector2.zero);
            if (raycast.transform != null)
            {
                transform.position = raycast.point;
                camCollider.transform.position = raycast.point;
                myCamera.transform.position = new Vector3(raycast.point.x, raycast.point.y, myCamera.transform.position.z);
            }
            if (Input.GetMouseButtonDown(0))
            {
                texture = ScreenShot();

                StartCoroutine(Shot());
            }
        }

    }
    private int NewType(List<GameObject> something)
    {
        int flag = 0;
        if (something.Count == 0)
        {
            return 0;
        }
        foreach (GameObject item in something)
        {
            if (item.tag == "TV")
            {
                flag = 1;
            }
        }
        if (flag != 0)
        {
            return flag;
        }
        //筛选特殊人物返回特定值,剩下就是群众演员
        List<GameObject> gg = new List<GameObject>();
        foreach (GameObject item in something)
        {

        }

        return -1;
    }
    private void SetNew(string imageName, string textStr)
    {
        newsImage.sprite = Resources.Load<Sprite>(imageName);
        newsText.text = textStr;
    }
    private Texture2D ScreenShot()
    {
        Texture2D screenShot = new Texture2D(rt.width, rt.height, TextureFormat.RGB24, false);
        RenderTexture.active = rt;
        screenShot.ReadPixels(new Rect(0, 0, rt.width, rt.height), 0, 0);
        screenShot.Apply();
        RenderTexture.active = null;
        return screenShot;
    }
    IEnumerator Shot()
    {
        //动画
        //接近
        isShot = true;
        rawImage.gameObject.SetActive(true);
        rawImage.texture = texture;
        mainCamera.DOOrthoSize(myCamera.orthographicSize, 2.0f);
        mainCamera.transform.DOMove(myCamera.transform.position, 2.0f);

        yield return new WaitForSeconds(2.0f);
        //切换到小电视
        TVRawImage.texture = texture;
        rawImage.gameObject.SetActive(false);
        mainCamera.transform.position = new Vector3(TVRawImage.transform.position.x, TVRawImage.transform.position.y, mainCamera.transform.position.z);
        mainCamera.orthographicSize = 0.7f;
        cam.SetActive(false);
        //标题更新
        switch (NewType(camCollider.GetComponent<camCollider>().something))
        {
            case 0:
                SetNew("chyron3", "");
                break;
            case 1:
                SetNew("chyron2", "啊哦！电视里有个电视");
                break;
            default:
                SetNew("chyron2", "你要找点有价值的新闻");
                break;
        }
        newsImage.GetComponent<Animator>().SetTrigger("new");
        yield return new WaitForSeconds(1.0f);
        //缩小视图
        mainCamera.DOOrthoSize(mainCamOrthographicSize / 2, 1.0f);

        yield return new WaitForSeconds(1.5f);

        mainCamera.DOOrthoSize(mainCamOrthographicSize, 1.0f);
        mainCamera.transform.DOMove(mainCamPoint, 1.0f);

        yield return new WaitForSeconds(1.2f);

        isShot = false;
        cam.SetActive(true);
    }
}
