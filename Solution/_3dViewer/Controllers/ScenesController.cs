using _3dViewer.Data;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using _3dViewer.Models;
using Microsoft.EntityFrameworkCore;
using _3dViewer.ViewModels;
using Microsoft.AspNetCore.Identity;
using System.IO;
using Microsoft.AspNetCore.Authorization;

namespace _3dViewer.Controllers
{
    [Authorize]
    public class ScenesController : Controller
    {
        private readonly AppDbContext _context;

        private readonly UserManager<AspNetUsers> _userManager;

        public ScenesController(AppDbContext context, UserManager<AspNetUsers> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Scenes scenes)
        {
            Scenes scene = new Scenes
            {
                Name = scenes.Name,
                Description = scenes.Description,
                Source = "empty",
                Ispublic = false
            };

            AspNetUsers netUsers = await _userManager.FindByNameAsync(User.Identity.Name);

            Permissions permission = new Permissions
            {
                Scene = scene.Id,
                User = _userManager.GetUserId(HttpContext.User),
                SceneNavigation = scene,
                UserNavigation = netUsers
            };

            _context.Add(scene);
            _context.Add(permission);
            await _context.SaveChangesAsync();
            return Json(new { name = scene.Name, description = scene.Description, id = scene.Id });
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return Json(new { error = "Неверный индентификатор сцены" });
            }

            Scenes scene = await _context.Scenes.FindAsync(id);
            
            if (scene == null)
            {
                return Json(new { error = "Сцены не существует" });
            }

            var annotations = _context.Annotations.Where(p => p.Scene == scene.Id).OrderBy(p => p.Id).AsNoTracking();

            var models = _context.ModelsList.AsNoTracking().ToList();

            SceneViewModel sceneView = new SceneViewModel { scene = scene, annotations = annotations, modelsLists = models };

            return View(sceneView);
        }

        [HttpGet]
        public IActionResult FileExist(int? id)
        {
            string userId = _userManager.GetUserId(HttpContext.User);

            if (System.IO.File.Exists($"UsersData/{userId}/{id}_source.txt"))
            {
                string source_text = System.IO.File.ReadAllText($"UsersData/{userId}/{id}_source.txt");
                return Json(new { source = source_text });
            }
            
            return Json(new { status = 0 });
        }

        [HttpPost, ActionName("SaveScene"), DisableRequestSizeLimit]
        public async Task<IActionResult> SaveScene([FromBody] SaveSceneViewModel saveScene)
        {
            string userId = _userManager.GetUserId(HttpContext.User);

            if (!Directory.Exists($"UsersData/{userId}"))
            {
                Directory.CreateDirectory($"UsersData/{userId}");
            }

            using (StreamWriter streamWriter = new StreamWriter($"UsersData/{userId}/{saveScene.Id}_source.txt"))
            {
                await streamWriter.WriteAsync(saveScene.Source);
            }

            Scenes scene = new Scenes
            {
                Id = Convert.ToInt32(saveScene.Id),
                Name = saveScene.Name,
                Description = saveScene.Description,
                Source = "infile",
                Ispublic = false
            };

            try
            {
                _context.Update(scene);
                await _context.SaveChangesAsync();
                return Json(new { url = $"/Scenes/Edit/{saveScene.Id}" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ScenesExists(scene.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        [HttpPost, ActionName("AddAnnotation")]
        public async Task<IActionResult> AddAnnotation(string title, string description, string posx, string posy, string posz, string rotx, string roty, string rotz, string pivotposx, string pivotposy, string pivotposz, int sceneid)
        {
            Annotations annotation = new Annotations
            {
                Name = title,
                Description = description,
                Positionx = double.Parse(posx, System.Globalization.CultureInfo.InvariantCulture),
                Positiony = double.Parse(posy, System.Globalization.CultureInfo.InvariantCulture),
                Positionz = double.Parse(posz, System.Globalization.CultureInfo.InvariantCulture),
                Roatationx = double.Parse(rotx, System.Globalization.CultureInfo.InvariantCulture),
                Roatationy = double.Parse(roty, System.Globalization.CultureInfo.InvariantCulture),
                Roatationz = double.Parse(rotz, System.Globalization.CultureInfo.InvariantCulture),
                Pivotposx = double.Parse(pivotposx, System.Globalization.CultureInfo.InvariantCulture),
                Pivotposy = double.Parse(pivotposy, System.Globalization.CultureInfo.InvariantCulture),
                Pivotposz = double.Parse(pivotposz, System.Globalization.CultureInfo.InvariantCulture),
                Scene = sceneid
            };

            _context.Add(annotation);
            await _context.SaveChangesAsync();
            return Json(annotation);
        }

        [ActionName("DeleteScene")]
        public async Task<IActionResult> DeleteScene(int? id)
        {
            try
            {
                Scenes scene = _context.Scenes.FirstOrDefault(m => m.Id == id);

                List<Annotations> annotations = _context.Annotations.Where(m => m.Scene == id).ToList();
                List<Permissions> permissions = _context.Permissions.Where(m => m.Scene == id).ToList();

                _context.RemoveRange(annotations);
                await _context.SaveChangesAsync();

                _context.RemoveRange(permissions);
                await _context.SaveChangesAsync();

                _context.Scenes.Remove(scene);
                await _context.SaveChangesAsync();

                return Json(new { status = 1 });
            }
            catch (Exception)
            {
                return Json(new { status = 0});
            }
        }

        [HttpPost]
        [ActionName("DeleteAnnotation")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAnnotation(int? id)
        {
            int sceneid = _context.Annotations.Select(p => p.SceneNavigation).First().Id;

            Annotations annotations = _context.Annotations.FirstOrDefault(m => m.Id == id);
            _context.Annotations.Remove(annotations);
            await _context.SaveChangesAsync();

            return RedirectToAction("Edit", new { id = sceneid });
        }

        private bool ScenesExists(int id)
        {
            return _context.Scenes.Any(e => e.Id == id);
        }
    }
}
