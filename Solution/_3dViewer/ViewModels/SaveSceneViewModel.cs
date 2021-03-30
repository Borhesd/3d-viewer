using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace _3dViewer.ViewModels
{
    public class SaveSceneViewModel
    {
        public string Name { get; set; }

        public string Description { get; set; }

        public string Source { get; set; }

        public string Id { get; set; }
    }
}
