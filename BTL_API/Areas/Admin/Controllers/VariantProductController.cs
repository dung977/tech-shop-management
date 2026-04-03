using Microsoft.AspNetCore.Mvc;

namespace BTL_API.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class VariantProductController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
