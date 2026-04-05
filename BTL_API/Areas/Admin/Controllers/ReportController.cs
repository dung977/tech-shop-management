using Microsoft.AspNetCore.Mvc;

namespace BTL_API.Areas.Admin.Controllers
{
    public class ReportController : Controller
    {
        [Area("Admin")]
        public IActionResult Index()
        {
            return View();
        }
    }
}
