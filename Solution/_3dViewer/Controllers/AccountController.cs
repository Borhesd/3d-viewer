using _3dViewer.Data;
using _3dViewer.Models;
using _3dViewer.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace _3dViewer.Controllers
{
    public class AccountController : Controller
    {
        private readonly AppDbContext _context;

        private readonly UserManager<AspNetUsers> _userManager;
        private readonly SignInManager<AspNetUsers> _signInManager;

        public AccountController(UserManager<AspNetUsers> userManager, SignInManager<AspNetUsers> signInManager, AppDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
        }

        [Authorize]
        public IActionResult SecretView() => View();

        public IActionResult Register() => View();

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            try
            {
                AspNetUsers user = new AspNetUsers { UserName = model.Login, Userkey = "kawetb" };

                IdentityResult result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    return Json(new { status = 1, url = "/Account/LogIn" });
                }
                else
                {
                    return Json(new { status = 0, error = "Не удалось создать пользователя" });
                }
            }
            catch (Exception)
            {
                return Json(new { status = 0, error = "Не удалось создать пользователя" });
            }
        }

        /* Login */
        public IActionResult LogIn()
        {
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Hub");
            }
            else
            {
                return View();
            }
        }

        [HttpPost]
        public async Task<IActionResult> LogIn([FromBody] LoginViewModel model)
        {
            var user = await _userManager.FindByNameAsync(model.Login);

            if (user != null)
            {
                var result = await _signInManager.PasswordSignInAsync(user, model.Password, true, false);

                if (result.Succeeded)
                {
                    return Json(new { status = 1, url = "/Account/Hub"});
                }
                else
                {
                    return Json(new { status = 0, error = "Неверный пароль" });
                }
            }

            return Json(new { status = 0, error = "Такого пользователя не существует или неверный логин"});
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            // delete auth cookies
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }

        [Authorize]
        public async Task<IActionResult> Hub()
        {
            string userId = _userManager.GetUserId(HttpContext.User);

            var scenes = await _context.AspNetUsers
            .Where(p => p.Id == userId)
            .SelectMany(p => p.Permissions)
            .Select(pc => pc.SceneNavigation)
            .Select(p => new ScenesHubViewModel() 
            { 
                Id = p.Id,
                Name = p.Name,
                Description = p.Description
            })
            .ToListAsync();

            return View(scenes);
        }
    }
}
